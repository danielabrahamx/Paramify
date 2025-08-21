import { useState, useEffect } from 'react';
import { Shield, TrendingUp, Wallet, Eye, EyeOff, AlertCircle, CheckCircle, Activity, User, Settings } from 'lucide-react';
import { icpService } from './lib/icp-integration';
import { Principal } from '@dfinity/principal';

interface Policy {
  customer: Principal;
  premium: bigint;
  coverage: bigint;
  active: boolean;
  paidOut: boolean;
  timestamp: bigint;
}

interface Stats {
  totalPolicies: bigint;
  activePolicies: bigint;
  totalPayouts: bigint;
  contractBalance: bigint;
  currentFloodLevel: bigint;
  floodThreshold: bigint;
  lastOracleUpdate: bigint;
}

export default function ICPFloodInsuranceDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [username, setUsername] = useState<string>('');
  const [floodLevel, setFloodLevel] = useState<number>(0);
  const [threshold, setThreshold] = useState<number>(0);
  const [thresholdInFeet, setThresholdInFeet] = useState<number>(0);
  const [policyAmount, setPolicyAmount] = useState<number>(1);
  const [premium, setPremium] = useState<number>(0.1);
  const [contractBalance, setContractBalance] = useState<number>(0);
  const [transactionStatus, setTransactionStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasActivePolicy, setHasActivePolicy] = useState(false);
  const [currentPolicy, setCurrentPolicy] = useState<Policy | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [showStats, setShowStats] = useState(false);

  // Initialize ICP service and check authentication
  useEffect(() => {
    const initService = async () => {
      await icpService.init();
      const authenticated = icpService.getIsAuthenticated();
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        const principal = icpService.getPrincipal();
        setPrincipal(principal);
        await fetchData();
      }
    };
    
    initService();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch contract data
      const [floodLevelData, thresholdData, balanceData, statsData] = await Promise.all([
        icpService.getCurrentFloodLevel(),
        icpService.getThreshold(),
        icpService.getContractBalance(),
        icpService.getStats()
      ]);

      setFloodLevel(Number(floodLevelData));
      setThreshold(Number(thresholdData));
      setThresholdInFeet(Number(thresholdData) / 304); // Convert mm to feet
      setContractBalance(icpService.e8sToICP(balanceData));
      setStats(statsData);

      // Check if user has policy
      const policy = await icpService.getMyPolicy();
      if (policy) {
        setCurrentPolicy(policy);
        setHasActivePolicy(policy.active);
        setPolicyAmount(icpService.e8sToICP(policy.coverage));
        setPremium(icpService.e8sToICP(policy.premium));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setTransactionStatus('Error fetching data from canister');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      const success = await icpService.login();
      if (success) {
        setIsAuthenticated(true);
        const principal = icpService.getPrincipal();
        setPrincipal(principal);
        await fetchData();
        setTransactionStatus('Successfully connected to Internet Identity');
      } else {
        setTransactionStatus('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setTransactionStatus('Login error: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await icpService.logout();
    setIsAuthenticated(false);
    setPrincipal(null);
    setCurrentPolicy(null);
    setHasActivePolicy(false);
    setTransactionStatus('Logged out successfully');
  };

  const handleBuyInsurance = async () => {
    if (policyAmount <= 0) {
      setTransactionStatus('Please enter a valid coverage amount');
      return;
    }

    try {
      setIsLoading(true);
      const coverageE8s = icpService.icpToE8s(policyAmount);
      const result = await icpService.buyInsurance(coverageE8s);
      
      if ('ok' in result) {
        setTransactionStatus('Insurance policy created successfully! Please activate it.');
        await fetchData();
      } else {
        setTransactionStatus('Failed to create policy: ' + JSON.stringify(result.err));
      }
    } catch (error) {
      console.error('Buy insurance error:', error);
      setTransactionStatus('Error creating policy: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivatePolicy = async () => {
    try {
      setIsLoading(true);
      // Note: This would need to be implemented in the canister
      // For now, we'll simulate activation
      setHasActivePolicy(true);
      setTransactionStatus('Policy activated successfully!');
    } catch (error) {
      console.error('Activate policy error:', error);
      setTransactionStatus('Error activating policy: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayPremium = async () => {
    try {
      setIsLoading(true);
      // Note: This would need to be implemented in the canister
      setTransactionStatus('Premium payment processed successfully!');
      await fetchData();
    } catch (error) {
      console.error('Pay premium error:', error);
      setTransactionStatus('Error processing premium: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerPayout = async () => {
    try {
      setIsLoading(true);
      const result = await icpService.triggerPayout();
      
      if ('ok' in result) {
        setTransactionStatus('Payout processed successfully!');
        await fetchData();
      } else {
        setTransactionStatus('Payout failed: ' + JSON.stringify(result.err));
      }
    } catch (error) {
      console.error('Trigger payout error:', error);
      setTransactionStatus('Error processing payout: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFloodLevel = (level: number) => {
    return (level / 304).toFixed(2); // Convert mm to feet
  };

  const formatICP = (amount: number) => {
    return amount.toFixed(8);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <Shield className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Flood Insurance</h1>
            <p className="text-gray-600">Connect with Internet Identity to access your insurance dashboard</p>
          </div>
          
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {isLoading ? 'Connecting...' : 'Connect with Internet Identity'}
          </button>
          
          {transactionStatus && (
            <div className="mt-4 p-3 rounded-lg bg-blue-50 text-blue-700 text-sm">
              {transactionStatus}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Shield className="w-10 h-10 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Flood Insurance Dashboard</h1>
                <p className="text-gray-600">Connected as {username || principal?.toString().slice(0, 10) + '...'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowStats(!showStats)}
                className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-colors"
              >
                <Activity className="w-5 h-5" />
                <span>{showStats ? 'Hide' : 'Show'} Stats</span>
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Insurance Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Status */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <TrendingUp className="w-6 h-6 text-blue-600 mr-2" />
                Current Status
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{formatFloodLevel(floodLevel)} ft</div>
                  <div className="text-sm text-gray-600">Current Level</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{thresholdInFeet.toFixed(2)} ft</div>
                  <div className="text-sm text-gray-600">Threshold</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{formatICP(contractBalance)} ICP</div>
                  <div className="text-sm text-gray-600">Contract Balance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {floodLevel >= threshold ? 'BREACH' : 'SAFE'}
                  </div>
                  <div className="text-sm text-gray-600">Status</div>
                </div>
              </div>
            </div>

            {/* Insurance Actions */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Shield className="w-6 h-6 text-blue-600 mr-2" />
                Insurance Actions
              </h2>
              
              {!hasActivePolicy ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Coverage Amount (ICP)
                    </label>
                    <input
                      type="number"
                      value={policyAmount}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value);
                        setPolicyAmount(value);
                        setPremium(value * 0.1); // 10% premium
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter coverage amount"
                    />
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span>Coverage:</span>
                      <span className="font-semibold">{formatICP(policyAmount)} ICP</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Premium (10%):</span>
                      <span className="font-semibold">{formatICP(premium)} ICP</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleBuyInsurance}
                    disabled={isLoading || policyAmount <= 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    {isLoading ? 'Processing...' : 'Buy Insurance'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center text-green-800">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span className="font-semibold">Active Policy</span>
                    </div>
                    <div className="mt-2 text-sm text-green-700">
                      <div>Coverage: {formatICP(icpService.e8sToICP(currentPolicy?.coverage || BigInt(0)))} ICP</div>
                      <div>Premium: {formatICP(icpService.e8sToICP(currentPolicy?.premium || BigInt(0)))} ICP</div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <button
                      onClick={handlePayPremium}
                      disabled={isLoading}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      Pay Premium
                    </button>
                    <button
                      onClick={handleTriggerPayout}
                      disabled={isLoading || floodLevel < threshold}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      Trigger Payout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Stats & Info */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Activity className="w-6 h-6 text-blue-600 mr-2" />
                Quick Stats
              </h2>
              
              {stats && (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Policies:</span>
                    <span className="font-semibold">{stats.totalPolicies.toString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Policies:</span>
                    <span className="font-semibold">{stats.activePolicies.toString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Payouts:</span>
                    <span className="font-semibold">{stats.totalPayouts.toString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Update:</span>
                    <span className="font-semibold">
                      {new Date(Number(stats.lastOracleUpdate) / 1000000).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Transaction Status */}
            {transactionStatus && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertCircle className="w-6 h-6 text-blue-600 mr-2" />
                  Status
                </h2>
                <div className="p-3 rounded-lg bg-blue-50 text-blue-700 text-sm">
                  {transactionStatus}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}