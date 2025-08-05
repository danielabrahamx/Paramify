import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Waves, Shield, TrendingUp, Wallet, AlertCircle, CheckCircle, ArrowLeft, RefreshCw, Activity } from 'lucide-react';
import { PARAMIFY_ABI, MOCK_ORACLE_ABI, getContractAddresses, PARAMIFY_ADDRESS } from './lib/contract';
import { usgsApi, formatTimestamp, getTimeUntilNextUpdate, type ServiceStatus } from './lib/usgsApi';

interface ParamifyDashboardProps {
  setUserType?: (userType: string | null) => void;
}

export default function InsuracleDashboardAdmin({ setUserType }: ParamifyDashboardProps) {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [ethBalance, setEthBalance] = useState<number>(0);
  const [floodLevel, setFloodLevel] = useState<number>(0);
  const [threshold, setThreshold] = useState<number>(1200000000000); // 12 feet default
  const [thresholdInFeet, setThresholdInFeet] = useState<number>(12);
  const [newThresholdFeet, setNewThresholdFeet] = useState<string>("");
  const [coverageAmount, setCoverageAmount] = useState<string>("");
  const [premium, setPremium] = useState<number>(0);
  const [insuranceAmount, setInsuranceAmount] = useState<number>(0);
  const [contractBalance, setContractBalance] = useState<number>(0);
  const [fundAmount, setFundAmount] = useState<string>("");
  const [transactionStatus, setTransactionStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingThreshold, setIsUpdatingThreshold] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [hasActivePolicy, setHasActivePolicy] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [walletChecked, setWalletChecked] = useState(false);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [nextUpdateCountdown, setNextUpdateCountdown] = useState<string>('');

  // Helper function to get contract addresses for current network
  const getContracts = async (provider: ethers.BrowserProvider) => {
    const network = await provider.getNetwork();
    const contractAddresses = getContractAddresses();
    return {
      paramify: new ethers.Contract(contractAddresses.paramify, PARAMIFY_ABI, provider),
      mockOracle: new ethers.Contract(contractAddresses.oracle, MOCK_ORACLE_ABI, provider),
      addresses: contractAddresses
    };
  };

  const handleConnectWallet = async () => {
    if (!window.ethereum) {
      setTransactionStatus('MetaMask not detected. Please install MetaMask.');
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        setTransactionStatus('Please connect your wallet to use the admin dashboard.');
        setIsAdmin(false);
        setWalletChecked(true);
        return;
      }
      setWalletAddress(accounts[0]);
      const adminAddress = '0x00f2Ef6EB91C2732ca51EAb96cfA92Cd410AC4dF'.toLowerCase();
      if (accounts[0].toLowerCase() === adminAddress) {
        setIsAdmin(true);
        setTransactionStatus('');
      } else {
        setIsAdmin(false);
        setTransactionStatus('You must be connected as the admin to access this dashboard.');
      }
      setWalletChecked(true);
    } catch (e) {
      setTransactionStatus('Error checking wallet connection.');
      setIsAdmin(false);
      setWalletChecked(true);
      return;
    }
  };

  useEffect(() => {
    // Listen for account changes in MetaMask
    if (window.ethereum && window.ethereum.on) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (!accounts || accounts.length === 0) {
          setIsAdmin(false);
          setTransactionStatus('Please connect your wallet to use the admin dashboard.');
          setWalletChecked(false);
        } else {
          setWalletAddress(accounts[0]);
          const adminAddress = '0x00f2Ef6EB91C2732ca51EAb96cfA92Cd410AC4dF'.toLowerCase();
          if (accounts[0].toLowerCase() === adminAddress) {
            setIsAdmin(true);
            setTransactionStatus('');
          } else {
            setIsAdmin(false);
            setTransactionStatus('You must be connected as the admin to access this dashboard.');
          }
          setWalletChecked(true);
        }
      };
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (window.ethereum) {
        try {
          // Ensure we're on the correct network
          await switchToLocalNetwork();
          
          const provider = new ethers.BrowserProvider(window.ethereum);
          const network = await provider.getNetwork();
          console.log('Connected to network:', network.chainId);
          
          const accounts = await provider.send('eth_requestAccounts', []);
          setWalletAddress(accounts[0]);
          const balance = await provider.getBalance(accounts[0]);
          setEthBalance(Number(ethers.formatEther(balance)));
          
          // Get contract addresses for the current network
          const contractAddresses = getContractAddresses();
          const contract = new ethers.Contract(contractAddresses.paramify, PARAMIFY_ABI, provider);
          try {
            // Prefer reading balance directly from chain to avoid stale contract getter discrepancies
            const rawBal = await provider.getBalance(contractAddresses.paramify);
            setContractBalance(Number(ethers.formatEther(rawBal)));
            const latestFlood = await contract.getLatestPrice();
            setFloodLevel(Number(latestFlood));
            
            // Fetch current threshold
            try {
              const currentThreshold = await contract.floodThreshold();
              setThreshold(Number(currentThreshold));
              setThresholdInFeet(Number(currentThreshold) / 100000000000);
            } catch (e) {
              console.log('Could not fetch threshold:', e);
            }
          } catch (e) {
            console.log('Contract calls failed, contract may not be deployed yet:', e);
          }
        } catch (e) {
          console.error('Failed to connect to network:', e);
        setTransactionStatus('Please connect to PassetHub Testnet (Chain ID: 420420422 or current RPC-reported)');
        }
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchAdminStatus = async () => {
      if (window.ethereum) {
        try {
          await switchToLocalNetwork();
          const provider = new ethers.BrowserProvider(window.ethereum);
          const network = await provider.getNetwork();
          const contractAddresses = getContractAddresses();
          const accounts = await provider.send('eth_requestAccounts', []);
          const contract = new ethers.Contract(contractAddresses.paramify, PARAMIFY_ABI, provider);
          // Assume contract has a public 'hasRole' method and ADMIN_ROLE constant
          const ADMIN_ROLE = ethers.id('DEFAULT_ADMIN_ROLE');
          const isAdmin = await contract.hasRole(ADMIN_ROLE, accounts[0]);
          setIsAdmin(isAdmin);
        } catch (e) {
          setIsAdmin(false);
        }
      }
    };
    fetchAdminStatus();
  }, []);

  // Fetch USGS service status
  useEffect(() => {
    const fetchServiceStatus = async () => {
      try {
        const status = await usgsApi.getStatus();
        setServiceStatus(status);
        setIsBackendConnected(true);
        
        // Update flood level from USGS data
        if (status.oracleValue !== null) {
          setFloodLevel(status.oracleValue * 100000000000); // Convert feet to contract units
        }
        
        // Update threshold from service status
        if (status.threshold) {
          setThresholdInFeet(status.threshold.thresholdFeet);
          setThreshold(Number(status.threshold.thresholdUnits));
        }
      } catch (error) {
        console.error('Failed to fetch USGS service status:', error);
        setIsBackendConnected(false);
      }
    };

    fetchServiceStatus();
    const interval = setInterval(fetchServiceStatus, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Update countdown timer
  useEffect(() => {
    const updateCountdown = () => {
      if (serviceStatus?.nextUpdate) {
        setNextUpdateCountdown(getTimeUntilNextUpdate(serviceStatus.nextUpdate));
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [serviceStatus]);

  const handleManualUSGSUpdate = async () => {
    try {
      setTransactionStatus('Triggering USGS data update...');
      const result = await usgsApi.triggerManualUpdate();
      if (result.success) {
        setTransactionStatus('USGS data updated successfully!');
        // Refresh service status
        const status = await usgsApi.getStatus();
        setServiceStatus(status);
      }
    } catch (error) {
      console.error('Failed to trigger manual update:', error);
      setTransactionStatus('Failed to update USGS data');
    }
    setTimeout(() => setTransactionStatus(''), 5000);
  };

  const calculatePremium = (coverage: number) => coverage * 0.1;

  const handleCoverageChange = (value: string) => {
    setCoverageAmount(value);
    const coverage = parseFloat(value) || 0;
    setPremium(calculatePremium(coverage));
  };

  const handleUpdateThreshold = async () => {
    if (!newThresholdFeet) return;
    
    const thresholdValue = parseFloat(newThresholdFeet);
    if (isNaN(thresholdValue) || thresholdValue <= 0) {
      setTransactionStatus('Invalid threshold value. Must be a positive number.');
      setTimeout(() => setTransactionStatus(''), 5000);
      return;
    }
    
    if (thresholdValue > 100) {
      setTransactionStatus('Threshold too high. Maximum is 100 feet.');
      setTimeout(() => setTransactionStatus(''), 5000);
      return;
    }
    
    setIsUpdatingThreshold(true);
    setTransactionStatus('Updating threshold...');
    
    try {
      const response = await fetch('http://localhost:3001/api/threshold', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ thresholdFeet: thresholdValue })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setTransactionStatus('Threshold updated successfully!');
        setThresholdInFeet(data.thresholdFeet);
        setThreshold(Number(data.thresholdUnits));
        setNewThresholdFeet(""); // Clear input
        
        // Refresh service status
        const status = await usgsApi.getStatus();
        setServiceStatus(status);
      } else {
        throw new Error(data.error || 'Failed to update threshold');
      }
    } catch (e: any) {
      console.error('Threshold update error:', e);
      setTransactionStatus(`Threshold update failed! ${e.message || 'Unknown error'}`);
    }
    
    setIsUpdatingThreshold(false);
    setTimeout(() => setTransactionStatus(''), 5000);
  };

  const handleBuyInsurance = async () => {
    if (!window.ethereum || !coverageAmount) return;
    setIsLoading(true);
    setTransactionStatus('Processing insurance purchase...');
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
          const contractAddresses = getContractAddresses();
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddresses.paramify, PARAMIFY_ABI, signer);
      const coverage = ethers.parseEther(coverageAmount);
      const calculatedPremium = ethers.parseEther(premium.toString());
      const tx = await contract.buyInsurance(coverage, { value: calculatedPremium });
      await tx.wait();
      setTransactionStatus('Insurance purchased successfully!');
      setHasActivePolicy(true);
      setInsuranceAmount(parseFloat(coverageAmount));
      const balance = await provider.getBalance(walletAddress);
      setEthBalance(Number(ethers.formatEther(balance)));
      const contractBal = await contract.getContractBalance();
      setContractBalance(Number(ethers.formatEther(contractBal)));
    } catch (e: any) {
      console.error('Insurance purchase error:', e);
      setTransactionStatus(`Insurance purchase failed! ${e.reason || e.message || 'Unknown error'}`);
    }
    setIsLoading(false);
    setTimeout(() => setTransactionStatus(''), 5000);
  };

  const handleFundContract = async () => {
    if (!window.ethereum || !fundAmount) return;
    // Prevent accidental huge funding amounts on the testnet
    const fundValue = parseFloat(fundAmount);
    if (isNaN(fundValue) || fundValue <= 0) {
      setTransactionStatus('Enter a valid funding amount.');
      return;
    }
    setIsFunding(true);
    setTransactionStatus('Funding contract...');
    try {
      // Ensure we're on the correct network first
      await switchToLocalNetwork();
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Check network - support PolkaVM local node
      const network = await provider.getNetwork();
      if (!network.chainId) {
        throw new Error('Please switch to PassetHub Testnet (use the in-app button to add/switch)');
      }
      
      // Get the correct contract address for the current network
      const contractAddresses = getContractAddresses();
      const paramifyAddress = contractAddresses.paramify;
      
      // Verify contract exists
      const code = await provider.getCode(paramifyAddress);
      if (code === '0x') {
        throw new Error('Contract not found at address. Please ensure the contract is deployed.');
      }
      
      // Let the RPC/node estimate fees to avoid -32603 Internal JSON-RPC errors from unsupported fee fields
      // Keep only minimal parameters for widest adapter compatibility
      const tx = await signer.sendTransaction({
        to: paramifyAddress,
        value: ethers.parseEther(fundAmount)
      });
      
      await tx.wait();
      setTransactionStatus('Contract funded successfully!');
      
      // Read balance directly from provider to ensure UI parity across views
      const rawBalAfter = await provider.getBalance(paramifyAddress);
      setContractBalance(Number(ethers.formatEther(rawBalAfter)));
      const balance = await provider.getBalance(walletAddress);
      setEthBalance(Number(ethers.formatEther(balance)));
      setFundAmount(""); // Clear the input after successful funding
    } catch (e: any) {
      console.error('Funding error:', e);
      let errorMessage = 'Unknown error';
      if (e.message) {
        errorMessage = e.message;
      } else if (e.reason) {
        errorMessage = e.reason;
      } else if (e.code === -32603) {
        // Internal JSON-RPC error – likely node issue; advise user to retry or check node status
        errorMessage = 'Internal RPC error. Please try again later or verify the PassetHub node is operational.';
      } else if (e.code === 'CALL_EXCEPTION') {
        errorMessage = 'Transaction failed - contract may not be deployed or network issue';
      } else if (e.code === 'UNKNOWN_ERROR' && e.message?.includes('404')) {
        errorMessage = 'Network connection failed. Please ensure you are connected to PassetHub Testnet';
      }
      setTransactionStatus(`Funding failed! ${errorMessage}`);
    }
    setIsFunding(false);
    setTimeout(() => setTransactionStatus(''), 5000);
  };

  const handleTriggerPayout = async () => {
    if (!window.ethereum) return;
    setIsLoading(true);
    setTransactionStatus('Triggering payout...');
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const contractAddresses = getContractAddresses();
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(contractAddresses.paramify, PARAMIFY_ABI, signer);
      const tx = await contract.triggerPayout();
      await tx.wait();
      setTransactionStatus('Payout triggered successfully!');
      setHasActivePolicy(false);
      setInsuranceAmount(0);
      // Update balances
      const balance = await provider.getBalance(walletAddress);
      setEthBalance(Number(ethers.formatEther(balance)));
      const contractBal = await contract.getContractBalance();
      setContractBalance(Number(ethers.formatEther(contractBal)));
    } catch (e: any) {
      console.error('Payout trigger error:', e);
      setTransactionStatus(`Payout failed! ${e.reason || e.message || 'Unknown error'}`);
    }
    setIsLoading(false);
    setTimeout(() => setTransactionStatus(''), 5000);
  };

  const addLocalNetwork = async () => {
    if (!window.ethereum) return;
    
    // Detect if we're in Codespaces
    const isCodespaces = window.location.hostname.includes('app.github.dev') || 
                        window.location.hostname.includes('github.dev');
    
    const rpcUrl = isCodespaces 
      ? 'https://expert-couscous-4j6674wqj9jr2q7xx-8545.app.github.dev'
      : 'https://testnet-passet-hub-eth-rpc.polkadot.io';
    
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x190f1b46', // RPC-reported eth_chainId
          chainName: 'PassetHub Testnet',
          nativeCurrency: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: [rpcUrl],
          blockExplorerUrls: null
        }]
      });
      setTransactionStatus(`Network added with RPC: ${rpcUrl}`);
    } catch (error) {
      console.error('Failed to add network:', error);
      setTransactionStatus(`Failed to add network. RPC URL: ${rpcUrl}`);
    }
  };

  const switchToLocalNetwork = async () => {
    if (!window.ethereum) return;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x190f1b46' }] // RPC-reported eth_chainId
      });
    } catch (error: any) {
      if (error.code === 4902) {
        // Network not added yet, add it
        await addLocalNetwork();
      } else {
        console.error('Failed to switch network:', error);
      }
    }
  };

  const roleStatuses = [
    { name: 'Admin', status: true },
    { name: 'Oracle Updater', status: true },
    { name: 'Insurance Admin', status: true }
  ];

  // Only show admin dashboard if isAdmin is true
  if (!walletChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="bg-black/70 p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Admin Dashboard</h2>
          <p className="text-white/80 mb-2">Please connect your wallet to continue.</p>
          <button
            onClick={handleConnectWallet}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all"
          >
            Connect Wallet
          </button>
          {transactionStatus && (
            <div className="mt-4 text-red-400">{transactionStatus}</div>
          )}
        </div>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="bg-black/70 p-8 rounded-lg shadow-lg text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
          <p className="text-white/80 mb-2">You must be connected as the admin to access this dashboard.</p>
          <p className="text-white/60 text-sm mb-4">Admin address: 0x00f2Ef6EB91C2732ca51EAb96cfA92Cd410AC4dF</p>
          <button
            onClick={() => setUserType && setUserType(null)}
            className="mt-4 px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setUserType && setUserType(null)}
              className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-4 py-2 rounded-lg transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </button>
            <div className="flex items-center justify-center">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full shadow-lg">
                <Waves className="h-8 w-8 text-white" />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                👑 ADMIN
              </div>
            </div>
          </div>
          <div className="mb-4">
            <p className="text-gray-300 text-sm mb-2">Paramify Logo</p>
            <h1 className="text-3xl font-bold text-white mb-2">
              Paramify: Flood Insurance Oracle
            </h1>
            <p className="text-gray-300 text-lg">
              Buy flood insurance and claim payouts if flood levels exceed the threshold.
            </p>
          </div>
        </div>


        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl">
          {/* Network connection status */}
          <div className="mb-6">
            <div className="flex items-center justify-between bg-black/20 rounded-lg p-4">
              <div className="flex flex-col">
                <span className="text-white font-medium">Network Status</span>
                <span className="text-gray-400 text-xs mt-1">
                  RPC: {window.location.hostname.includes('app.github.dev') || window.location.hostname.includes('github.dev') 
                    ? 'Codespaces URL' 
                    : 'localhost:8545'}
                </span>
              </div>
              <button
                onClick={switchToLocalNetwork}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-all duration-200"
              >
                Connect to PassetHub Testnet
              </button>
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Wallet className="h-5 w-5 text-purple-300" />
                <span className="text-white font-medium">Connected Wallet</span>
              </div>
            </div>
            <div className="bg-black/20 rounded-lg p-4 mb-4">
              <p className="text-gray-300 font-mono text-sm">
                Connected: {walletAddress}
              </p>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold text-white">Your Balance: {ethBalance.toFixed(3)} ETH</span>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-blue-300" />
              Flood Level
            </h3>
            <div className="space-y-4">
              <div className={`rounded-lg p-6 ${floodLevel >= threshold ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-400/30' : 'bg-gradient-to-r from-blue-500/20 to-purple-500/20'}`}>
                <div className="text-center">
                  <div className={`text-3xl font-bold mb-2 ${floodLevel >= threshold ? 'text-red-300' : 'text-white'}`}>
                    {(floodLevel / 100000000000).toFixed(2)} ft
                  </div>
                  <div className="text-gray-300">
                    (Threshold: {thresholdInFeet.toFixed(1)} ft)
                  </div>
                  <div className="text-gray-400 text-sm mt-1">
                    = {floodLevel.toFixed(0)} units
                  </div>
                  {floodLevel >= threshold && (
                    <div className="mt-2 text-red-300 font-semibold">⚠️ THRESHOLD EXCEEDED</div>
                  )}
                </div>
              </div>
              {isAdmin && (
                <div className="bg-black/20 rounded-lg p-4 mt-2">
                  <h4 className="text-white font-medium mb-3 flex items-center">
                    <Shield className="h-4 w-4 mr-2 text-yellow-300" />
                    Threshold Management
                  </h4>
                  <div className="bg-black/30 rounded-lg p-3 mb-3">
                    <p className="text-gray-400 text-xs mb-1">Current Threshold</p>
                    <p className="text-white font-bold">{thresholdInFeet.toFixed(1)} feet</p>
                    <p className="text-gray-400 text-xs mt-1">= {threshold.toFixed(0)} units</p>
                  </div>
                  <div className="space-y-3">
                    <input
                      type="number"
                      value={newThresholdFeet}
                      onChange={(e) => setNewThresholdFeet(e.target.value)}
                      className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder="New threshold (feet)"
                      step="0.1"
                      min="0"
                      max="100"
                    />
                    <button
                      onClick={handleUpdateThreshold}
                      disabled={isUpdatingThreshold || !newThresholdFeet}
                      className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
                    >
                      {isUpdatingThreshold ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Updating...
                        </div>
                      ) : (
                        'Update Threshold'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* USGS Data Integration Status */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Activity className="mr-2 h-5 w-5 text-green-300" />
              USGS Real-Time Data
            </h3>
            <div className="bg-black/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${isBackendConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
                  <span className={`text-sm font-medium ${isBackendConnected ? 'text-green-300' : 'text-red-300'}`}>
                    {isBackendConnected ? 'Connected to USGS Service' : 'USGS Service Disconnected'}
                  </span>
                </div>
                <button
                  onClick={handleManualUSGSUpdate}
                  className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs transition-all duration-200"
                >
                  <RefreshCw className="h-3 w-3 inline mr-1" />
                  Manual Update
                </button>
              </div>
              
              {serviceStatus && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Data Source:</span>
                      <span className="text-white ml-2">{serviceStatus.dataSource}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Site:</span>
                      <span className="text-white ml-2">{serviceStatus.site.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Current Level:</span>
                      <span className="text-blue-300 ml-2 font-bold">
                        {serviceStatus.currentFloodLevel?.toFixed(2) || 'N/A'} ft
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-400">Oracle Value:</span>
                      <span className="text-purple-300 ml-2 font-mono">
                        {serviceStatus.oracleValue?.toFixed(0) || 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="border-t border-white/10 pt-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Update Interval:</span>
                      <span className="text-white">{serviceStatus.updateInterval}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span className="text-gray-400">Last Update:</span>
                      <span className="text-white">
                        {serviceStatus.lastUpdate ? formatTimestamp(serviceStatus.lastUpdate) : 'Never'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm mt-1">
                      <span className="text-gray-400">Next Update:</span>
                      <span className="text-green-300 font-mono">
                        {nextUpdateCountdown || 'Calculating...'}
                      </span>
                    </div>
                  </div>
                  
                  {serviceStatus.threshold && (
                    <div className="bg-black/30 rounded-lg p-3 mt-3">
                      <div className="text-xs text-gray-400 mb-2">Threshold Configuration</div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Threshold:</span>
                          <span className="text-yellow-300 ml-2 font-bold">
                            {serviceStatus.threshold.thresholdFeet} ft
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400">Units:</span>
                          <span className="text-yellow-300 ml-2 font-mono">
                            {serviceStatus.threshold.thresholdUnits}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Contract Management */}
          {isAdmin && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Shield className="mr-2 h-5 w-5 text-yellow-300" />
                Contract Management
              </h3>
              <div className="bg-black/20 rounded-lg p-4">
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-300">Contract Balance</span>
                    <span className="text-white font-bold">{contractBalance.toFixed(3)} ETH</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((contractBalance / 100) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <input
                    type="number"
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    className="w-full bg-black/30 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Amount to fund (ETH, e.g., 0.1)"
                    step="0.001"
                  />
                  <button
                    onClick={handleFundContract}
                    disabled={isFunding || !fundAmount}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
                  >
                    {isFunding ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Funding...
                      </div>
                    ) : (
                      'Fund Contract'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Admin Role Status */}
          {isAdmin && (
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                <CheckCircle className="mr-2 h-5 w-5 text-green-300" />
                Admin Permissions
              </h3>
              <div className="bg-black/20 rounded-lg p-4">
                <div className="space-y-3">
                  {roleStatuses.map((role, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-300">{role.name}</span>
                      <div className="flex items-center space-x-2">
                        {role.status ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-400" />
                        )}
                        <span className={role.status ? "text-green-300" : "text-red-300"}>
                          {role.status ? "Granted" : "Denied"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Transaction Status */}
          {transactionStatus && (
            <div className={`p-4 rounded-lg mb-4 ${
              transactionStatus.includes('success') || transactionStatus.includes('Success') || transactionStatus.includes('✅')
                ? 'bg-green-500/20 border border-green-400/30 text-green-300'
                : transactionStatus.includes('fail') || transactionStatus.includes('error') || transactionStatus.includes('Error') || transactionStatus.includes('❌')
                ? 'bg-red-500/20 border border-red-400/30 text-red-300'
                : 'bg-blue-500/20 border border-blue-400/30 text-blue-300'
            }`}>
              {transactionStatus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
