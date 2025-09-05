import { useState, useEffect } from 'react';
import { Waves, Shield, TrendingUp, Wallet, Eye, EyeOff, AlertCircle, CheckCircle, Activity, RefreshCw } from 'lucide-react';
import { createActor, backendAPI } from './lib/contract';
import { loginWithInternetIdentity, logoutFromInternetIdentity, getCurrentPrincipal, isAuthenticated, formatPrincipal } from './lib/icp';
import { Principal } from '@dfinity/principal';

interface ICPDashboardProps {
  setUserType?: (userType: string | null) => void;
}

interface FloodData {
  value: number;
  timestamp: string;
  lastUpdate: string;
  status: string;
  isFloodCondition: boolean;
  threshold: number;
}

interface PolicyStats {
  total: number;
  active: number;
  paidOut: number;
}

export default function ICPDashboard({ setUserType }: ICPDashboardProps) {
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [floodData, setFloodData] = useState<FloodData | null>(null);
  const [floodLevel, setFloodLevel] = useState<number>(0);
  const [threshold, setThreshold] = useState<number>(12.0);
  const [policyStats, setPolicyStats] = useState<PolicyStats>({ total: 0, active: 0, paidOut: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [nextUpdateCountdown, setNextUpdateCountdown] = useState<string>('');

  // Initialize authentication and fetch data
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check if user is already authenticated
        if (isAuthenticated()) {
          const currentPrincipal = getCurrentPrincipal();
          if (currentPrincipal) {
            setPrincipal(currentPrincipal);
            await fetchAllData();
          }
        }
        
        // Check backend connection
        await checkBackendConnection();
      } catch (err) {
        console.error('Initialization error:', err);
        setError('Failed to initialize application');
      }
    };

    initializeApp();
  }, []);

  const checkBackendConnection = async () => {
    try {
      const health = await backendAPI.getHealth();
      setIsBackendConnected(true);
      console.log('Backend connected:', health);
    } catch (err) {
      setIsBackendConnected(false);
      console.error('Backend connection failed:', err);
    }
  };

  const fetchAllData = async () => {
    if (!principal) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Fetch flood data from backend
      const floodDataResponse = await backendAPI.getFloodData();
      setFloodData(floodDataResponse);
      setFloodLevel(floodDataResponse.value || 0);
      setThreshold(floodDataResponse.threshold || 12.0);
      
      // Fetch canister data
      const actor = await createActor();
      const stats = await actor.get_policy_stats();
      setPolicyStats({
        total: Number(stats[0]),
        active: Number(stats[1]),
        paidOut: Number(stats[2])
      });
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch data from canister or backend');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const userPrincipal = await loginWithInternetIdentity();
      if (userPrincipal) {
        setPrincipal(userPrincipal);
        await fetchAllData();
        setUserType?.('user');
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError('Login failed. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutFromInternetIdentity();
      setPrincipal(null);
      setUserType?.(null);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  const handleCreatePolicy = async () => {
    if (!principal) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const actor = await createActor();
      const coverage = 1000000000; // 1 ICP token
      const premium = 100000000; // 0.1 ICP token
      
      const result = await actor.create_policy(coverage, premium);
      
      if ('Ok' in result) {
        console.log('Policy created with ID:', result.Ok);
        await fetchAllData(); // Refresh data
      } else {
        setError(`Failed to create policy: ${result.Err}`);
      }
    } catch (err) {
      console.error('Error creating policy:', err);
      setError('Failed to create policy');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshData = async () => {
    await fetchAllData();
  };

  const handleTestUSGS = async () => {
    try {
      const result = await backendAPI.testUSGS();
      console.log('USGS test result:', result);
      await fetchAllData(); // Refresh data
    } catch (err) {
      console.error('USGS test failed:', err);
      setError('Failed to test USGS data');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <Waves className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Paramify ICP Dashboard</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {isBackendConnected ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span>Backend Connected</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <span>Backend Disconnected</span>
                </div>
              )}
              
              {principal ? (
                <div className="flex items-center space-x-3">
                  <div className="text-sm text-gray-600">
                    <Wallet className="h-4 w-4 inline mr-1" />
                    {formatPrincipal(principal)}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleLogin}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Connect with Internet Identity
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Flood Monitoring */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 flex items-center">
                <Activity className="h-6 w-6 mr-2 text-blue-600" />
                Flood Monitoring
              </h2>
              <button
                onClick={handleRefreshData}
                disabled={isLoading}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Water Level</h3>
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {floodLevel.toFixed(2)} ft
                </div>
                <div className="text-sm text-gray-600">
                  Last updated: {floodData?.lastUpdate ? new Date(floodData.lastUpdate).toLocaleString() : 'Never'}
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Flood Threshold</h3>
                <div className="text-4xl font-bold text-orange-600 mb-2">
                  {threshold.toFixed(1)} ft
                </div>
                <div className="text-sm text-gray-600">
                  {floodLevel > threshold ? 'Flood condition detected!' : 'Normal conditions'}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleTestUSGS}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Test USGS Data Fetch
              </button>
            </div>
          </div>

          {/* Policy Management */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center">
              <Shield className="h-6 w-6 mr-2 text-green-600" />
              Policy Management
            </h2>

            {principal ? (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Policy Statistics</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Total Policies:</span>
                      <span className="font-semibold">{policyStats.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Active Policies:</span>
                      <span className="font-semibold text-green-600">{policyStats.active}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Paid Out:</span>
                      <span className="font-semibold text-blue-600">{policyStats.paidOut}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCreatePolicy}
                  disabled={isLoading}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Creating...' : 'Create Test Policy'}
                </button>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>Please connect with Internet Identity to manage policies</p>
              </div>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{floodLevel.toFixed(2)} ft</div>
              <div className="text-sm text-gray-600">Current Water Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{threshold.toFixed(1)} ft</div>
              <div className="text-sm text-gray-600">Flood Threshold</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${isBackendConnected ? 'text-green-600' : 'text-red-600'}`}>
                {isBackendConnected ? 'Online' : 'Offline'}
              </div>
              <div className="text-sm text-gray-600">Backend Status</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
