import React, { useState, useEffect } from 'react';
import './ICPStatus.css';

const ICPStatus = () => {
    const [icpStatus, setIcpStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkICPStatus = async () => {
            try {
                const response = await fetch('/api/icp-status');
                const data = await response.json();
                setIcpStatus(data);
            } catch (error) {
                console.error('Failed to fetch ICP status:', error);
                setIcpStatus({ status: 'ERROR', error: 'Connection failed' });
            } finally {
                setLoading(false);
            }
        };

        checkICPStatus();
        const interval = setInterval(checkICPStatus, 30000); // Check every 30 seconds
        
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="icp-status loading">
                <div className="spinner"></div>
                <span>Connecting to ICP...</span>
            </div>
        );
    }

    const isHealthy = icpStatus?.status === 'HEALTHY';

    return (
        <div className={`icp-status ${isHealthy ? 'healthy' : 'error'}`}>
            <div className="icp-header">
                <h3>🔗 ICP Integration</h3>
                <div className={`status-indicator ${isHealthy ? 'online' : 'offline'}`}>
                    {isHealthy ? '🟢 ONLINE' : '🔴 OFFLINE'}
                </div>
            </div>
            
            <div className="icp-details">
                <div className="detail-row">
                    <span className="label">Canister ID:</span>
                    <span className="value">{icpStatus?.canisterId || 'Unknown'}</span>
                </div>
                
                <div className="detail-row">
                    <span className="label">Data Storage:</span>
                    <span className="value">Decentralized on Internet Computer</span>
                </div>
                
                <div className="detail-row">
                    <span className="label">Last Check:</span>
                    <span className="value">{new Date().toLocaleTimeString()}</span>
                </div>
                
                {!isHealthy && icpStatus?.error && (
                    <div className="error-message">
                        Error: {icpStatus.error}
                    </div>
                )}
            </div>
            
            <div className="icp-features">
                <div className="feature">✅ Stable Memory Storage</div>
                <div className="feature">✅ Cross-chain Data Sync</div>
                <div className="feature">✅ HTTP Outcall Ready</div>
                <div className="feature">✅ Query Optimization</div>
            </div>
        </div>
    );
};

export default ICPStatus;