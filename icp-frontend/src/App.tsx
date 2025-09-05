import React, { useState, useEffect } from 'react';
import './App.css';
import { 
  loginWithInternetIdentity, 
  logoutFromInternetIdentity, 
  getCurrentPrincipal, 
  isAuthenticated, 
  formatPrincipal,
  isAdmin 
} from './lib/icp';
import { createActor, backendAPI } from './lib/contract';
import { Principal } from '@dfinity/principal';

// Enhanced ICP Frontend for Paramify Backend
function App() {
  const [backendStatus, setBackendStatus] = useState<string>('Checking...');
  const [floodData, setFloodData] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [policyStats, setPolicyStats] = useState({ total: 0, active: 0, paidOut: 0 });

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Check if user is already authenticated
      if (isAuthenticated()) {
        const currentPrincipal = getCurrentPrincipal();
        if (currentPrincipal) {
          setPrincipal(currentPrincipal);
          setIsAuthenticated(true);
        }
      }
      
      // Check backend connection and fetch data
      await checkBackendConnection();
      await fetchFloodData();
    } catch (err) {
      console.error('Initialization error:', err);
      setError('Failed to initialize application');
    }
  };

  const checkBackendConnection = async () => {
    try {
      const data = await backendAPI.getHealth();
      setBackendStatus(`✅ Connected - ${data.message}`);
      setIsConnected(true);
    } catch (error) {
      setBackendStatus('❌ Backend not reachable');
      setIsConnected(false);
    }
  };

  const fetchFloodData = async () => {
    try {
      const data = await backendAPI.getFloodData();
      setFloodData(data);
    } catch (error) {
      console.error('Error fetching flood data:', error);
      setError('Failed to fetch flood data');
    }
  };

  const testUSGS = async () => {
    try {
      const data = await backendAPI.testUSGS();
      console.log('USGS Test Result:', data);
      await fetchFloodData(); // Refresh data
    } catch (error) {
      console.error('Error testing USGS:', error);
      setError('Failed to test USGS data');
    }
  };

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      const userPrincipal = await loginWithInternetIdentity();
      if (userPrincipal) {
        setPrincipal(userPrincipal);
        setIsAuthenticated(true);
        await fetchFloodData(); // Refresh data after login
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutFromInternetIdentity();
      setPrincipal(null);
      setIsAuthenticated(false);
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
      const coverage = BigInt(1000000000); // 1 ICP token
      const premium = BigInt(100000000); // 0.1 ICP token
      
      const result = await actor.create_policy(coverage, premium);
      
      if ('Ok' in result) {
        console.log('Policy created with ID:', result.Ok);
        await fetchFloodData(); // Refresh data
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

  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <div className="header-left">
            <h1>🌊 Paramify ICP Dashboard</h1>
            <p>Internet Computer Flood Insurance Platform</p>
          </div>
          <div className="header-right">
            {isAuthenticated ? (
              <div className="auth-section">
                <div className="user-info">
                  <span className="user-principal">
                    {principal ? formatPrincipal(principal) : 'User'}
                  </span>
                  {principal && isAdmin(principal) && (
                    <span className="admin-badge">Admin</span>
                  )}
                </div>
                <button 
                  onClick={handleLogout}
                  className="btn btn-logout"
                  disabled={isLoading}
                >
                  Logout
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="btn btn-login"
                disabled={isLoading}
              >
                {isLoading ? 'Connecting...' : 'Connect with Internet Identity'}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="App-main">
        {/* Error Display */}
        {error && (
          <div className="error-card">
            <h3>⚠️ Error</h3>
            <p>{error}</p>
            <button onClick={() => setError('')} className="btn btn-small">
              Dismiss
            </button>
          </div>
        )}

        {/* Backend Status */}
        <div className="status-card">
          <h2>Backend Status</h2>
          <p className={isConnected ? 'status-connected' : 'status-disconnected'}>
            {backendStatus}
          </p>
          <button onClick={checkBackendConnection} className="btn">
            Refresh Status
          </button>
        </div>

        {/* Flood Data */}
        {floodData && (
          <div className="flood-card">
            <h2>🌊 Real-time Flood Data</h2>
            <div className="flood-info">
              <div className="flood-item">
                <strong>Current Water Level:</strong> {floodData.value?.toFixed(2) || 'N/A'} ft
              </div>
              <div className="flood-item">
                <strong>Flood Threshold:</strong> {floodData.threshold || 'N/A'} ft
              </div>
              <div className="flood-item">
                <strong>Status:</strong> 
                <span className={floodData.isFloodCondition ? 'flood-alert' : 'flood-normal'}>
                  {floodData.isFloodCondition ? '🚨 FLOOD ALERT' : '✅ Normal Conditions'}
                </span>
              </div>
              <div className="flood-item">
                <strong>Last Update:</strong> {floodData.lastUpdate ? new Date(floodData.lastUpdate).toLocaleString() : 'N/A'}
              </div>
            </div>
            <button onClick={testUSGS} className="btn">
              Test USGS Data Fetch
            </button>
          </div>
        )}

        {/* Policy Management */}
        {isAuthenticated && (
          <div className="policy-card">
            <h2>🛡️ Policy Management</h2>
            <div className="policy-info">
              <div className="policy-stats">
                <div className="stat-item">
                  <strong>Total Policies:</strong> {policyStats.total}
                </div>
                <div className="stat-item">
                  <strong>Active Policies:</strong> {policyStats.active}
                </div>
                <div className="stat-item">
                  <strong>Paid Out:</strong> {policyStats.paidOut}
                </div>
              </div>
              <div className="policy-actions">
                <button 
                  onClick={handleCreatePolicy}
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Test Policy'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* System Info */}
        <div className="info-card">
          <h2>System Information</h2>
          <div className="info-grid">
            <div className="info-item">
              <strong>Backend API:</strong> {BACKEND_URL}
            </div>
            <div className="info-item">
              <strong>ICP Replica:</strong> http://127.0.0.1:4943
            </div>
            <div className="info-item">
              <strong>Canister ID:</strong> uxrrr-q7777-77774-qaaaq-cai
            </div>
            <div className="info-item">
              <strong>USGS Site:</strong> 01646500 (Potomac River, DC)
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="actions-card">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button onClick={fetchFloodData} className="btn">
              Refresh Flood Data
            </button>
            <button onClick={testUSGS} className="btn">
              Test USGS Connection
            </button>
            <button onClick={checkBackendConnection} className="btn">
              Check Backend Health
            </button>
          </div>
        </div>
      </main>

      <footer className="App-footer">
        <p>Built with React + Internet Computer Protocol</p>
        <p>Real-time flood monitoring powered by USGS data</p>
      </footer>
    </div>
  );
}

export default App;
