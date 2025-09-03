# Backend Oracle Adaptation Guide for ICP

This guide explains how to modify the Node.js backend oracle service to interact with the ICP canister instead of Ethereum smart contracts.

## 1. Install ICP Dependencies

```bash
npm install @dfinity/agent @dfinity/principal node-fetch
```

## 2. Create ICP Agent Module

Create a new file `backend/icpAgent.js`:

```javascript
const { HttpAgent, Actor } = require('@dfinity/agent');
const { Principal } = require('@dfinity/principal');
const fetch = require('node-fetch');

// Import canister interface
const { idlFactory } = require('./paramify_insurance.did.js');

// Configuration
const CANISTER_ID = process.env.ICP_CANISTER_ID || 'your-canister-id';
const NETWORK = process.env.ICP_NETWORK || 'local';
const HOST = NETWORK === 'local' ? 'http://localhost:8080' : 'https://ic0.app';

// Oracle identity (using Ed25519 key pair)
const ORACLE_PRIVATE_KEY = process.env.ORACLE_PRIVATE_KEY;

// Create agent with oracle identity
async function createOracleAgent() {
  // For production, use proper key management
  const identity = await createIdentityFromPrivateKey(ORACLE_PRIVATE_KEY);
  
  const agent = new HttpAgent({
    host: HOST,
    identity: identity,
    fetch,
  });
  
  // For local development only
  if (NETWORK === 'local') {
    await agent.fetchRootKey();
  }
  
  return agent;
}

// Create actor instance
async function createActor() {
  const agent = await createOracleAgent();
  
  return Actor.createActor(idlFactory, {
    agent,
    canisterId: CANISTER_ID,
  });
}

// Helper to create identity from private key
async function createIdentityFromPrivateKey(privateKey) {
  // Implementation depends on your key management strategy
  // For hackathon, you can use:
  const { Ed25519KeyIdentity } = require('@dfinity/identity');
  
  if (!privateKey) {
    // Generate new identity for testing
    return Ed25519KeyIdentity.generate();
  }
  
  // Parse private key and create identity
  return Ed25519KeyIdentity.fromSecretKey(Buffer.from(privateKey, 'hex'));
}

module.exports = {
  createActor,
  createOracleAgent,
};
```

## 3. Update Server.js

Replace the Ethereum-specific code with ICP integration:

```javascript
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cron = require('node-cron');
const { createActor } = require('./icpAgent');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// USGS API configuration (unchanged)
const USGS_SITE_ID = '01646500';
const USGS_PARAMETER_CODE = '00065';
const USGS_API_URL = `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${USGS_SITE_ID}&parameterCd=${USGS_PARAMETER_CODE}&siteStatus=all`;

// Middleware
app.use(cors());
app.use(express.json());

// Global variables
let latestFloodData = {
  value: null,
  timestamp: null,
  lastUpdate: null,
  status: 'initializing',
  error: null,
  source: 'USGS Water Data',
  siteInfo: {
    name: 'Potomac River Near Wash, DC Little Falls Pump Sta',
    siteId: USGS_SITE_ID
  }
};

// ICP canister instance
let canisterActor = null;

// Initialize ICP connection
async function initializeICP() {
  try {
    console.log('🔗 Connecting to ICP canister...');
    canisterActor = await createActor();
    
    // Verify connection by getting current threshold
    const threshold = await canisterActor.get_flood_threshold();
    console.log('✅ ICP canister connected! Current threshold:', Number(threshold));
    
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to ICP canister:', error.message);
    return false;
  }
}

// Function to fetch USGS data (unchanged)
async function fetchUSGSData() {
  try {
    console.log('🌊 Fetching USGS water level data...');
    
    const response = await axios.get(USGS_API_URL);
    const data = response.data;
    
    const timeSeries = data.value.timeSeries[0];
    const latestValue = timeSeries.values[0].value[0];
    
    const waterLevelFeet = parseFloat(latestValue.value);
    const timestamp = latestValue.dateTime;
    
    console.log(`📊 Latest water level: ${waterLevelFeet} ft at ${timestamp}`);
    
    latestFloodData = {
      value: waterLevelFeet,
      timestamp: timestamp,
      lastUpdate: new Date().toISOString(),
      status: 'active',
      error: null,
      source: 'USGS Water Data',
      siteInfo: {
        name: timeSeries.sourceInfo.siteName,
        siteId: USGS_SITE_ID
      }
    };
    
    return waterLevelFeet;
  } catch (error) {
    console.error('❌ Error fetching USGS data:', error.message);
    latestFloodData.status = 'error';
    latestFloodData.error = error.message;
    throw error;
  }
}

// Function to update ICP canister
async function updateCanisterFloodLevel(waterLevel) {
  try {
    if (!canisterActor) {
      console.log('🔄 Attempting to reconnect to ICP canister...');
      const connected = await initializeICP();
      if (!connected) {
        throw new Error('Could not establish ICP connection');
      }
    }
    
    // Convert water level to scaled format (feet * 100000000000)
    const scaledValue = Math.floor(waterLevel * 100000000000);
    
    console.log(`🔄 Updating canister with scaled value: ${scaledValue} (${waterLevel} feet)`);
    
    // Update the flood level in the canister
    const result = await canisterActor.set_flood_level(scaledValue);
    
    if ('Ok' in result) {
      console.log('✅ Canister flood level updated successfully!');
      
      // Verify the update
      const newLevel = await canisterActor.get_flood_level();
      console.log(`🔍 Verified canister flood level: ${newLevel}`);
      
      return true;
    } else {
      throw new Error(result.Err);
    }
  } catch (error) {
    console.error('❌ Error updating canister:', error.message);
    latestFloodData.error = `Canister update failed: ${error.message}`;
    return false;
  }
}

// Main update function
async function updateFloodData() {
  try {
    console.log('\n🚀 Starting flood data update...');
    
    // Fetch latest USGS data
    const waterLevel = await fetchUSGSData();
    
    // Update ICP canister
    const updated = await updateCanisterFloodLevel(waterLevel);
    
    if (updated) {
      console.log('✅ Flood data update completed successfully!\n');
      latestFloodData.status = 'active';
      latestFloodData.error = null;
    } else {
      console.log('⚠️  USGS data updated, but canister update failed\n');
      latestFloodData.status = 'partial';
    }
  } catch (error) {
    console.error('❌ Failed to update flood data:', error.message);
    latestFloodData.status = 'error';
    latestFloodData.error = error.message;
  }
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Paramify ICP backend service is running',
    timestamp: new Date().toISOString(),
    canisterConnected: canisterActor !== null
  });
});

app.get('/api/flood-data', async (req, res) => {
  try {
    // Include threshold information from canister
    let thresholdData = null;
    if (canisterActor) {
      try {
        const thresholdUnits = await canisterActor.get_flood_threshold();
        const thresholdFeet = Number(thresholdUnits) / 100000000000;
        thresholdData = {
          thresholdUnits: thresholdUnits.toString(),
          thresholdFeet: thresholdFeet
        };
      } catch (error) {
        console.warn('Could not fetch threshold data:', error.message);
      }
    }
    
    res.json({
      ...latestFloodData,
      threshold: thresholdData
    });
  } catch (error) {
    res.json(latestFloodData);
  }
});

// Threshold management endpoints
app.get('/api/threshold', async (req, res) => {
  try {
    if (!canisterActor) {
      return res.status(503).json({ error: 'ICP canister connection not available' });
    }
    
    const thresholdUnits = await canisterActor.get_flood_threshold();
    const thresholdFeet = Number(thresholdUnits) / 100000000000;
    
    res.json({
      thresholdFeet: thresholdFeet,
      thresholdUnits: thresholdUnits.toString(),
      lastUpdate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching threshold:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/threshold', async (req, res) => {
  try {
    const { thresholdFeet } = req.body;
    
    // Validate input
    if (typeof thresholdFeet !== 'number' || thresholdFeet <= 0) {
      return res.status(400).json({ error: 'Invalid threshold value' });
    }
    
    if (thresholdFeet > 100) {
      return res.status(400).json({ error: 'Threshold too high' });
    }
    
    if (!canisterActor) {
      return res.status(503).json({ error: 'ICP canister connection not available' });
    }
    
    // Convert to canister units
    const thresholdUnits = Math.floor(thresholdFeet * 100000000000);
    
    console.log(`📊 Setting threshold to ${thresholdFeet} feet (${thresholdUnits} units)`);
    
    // Update the threshold
    const result = await canisterActor.set_flood_threshold(thresholdUnits);
    
    if ('Ok' in result) {
      // Verify the update
      const newThreshold = await canisterActor.get_flood_threshold();
      const newThresholdFeet = Number(newThreshold) / 100000000000;
      
      res.json({
        success: true,
        message: 'Threshold updated successfully',
        thresholdFeet: newThresholdFeet,
        thresholdUnits: newThreshold.toString()
      });
    } else {
      throw new Error(result.Err);
    }
  } catch (error) {
    console.error('Error updating threshold:', error);
    
    if (error.message?.includes('Unauthorized')) {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Policy management endpoints
app.get('/api/policies', async (req, res) => {
  try {
    if (!canisterActor) {
      return res.status(503).json({ error: 'ICP canister connection not available' });
    }
    
    const result = await canisterActor.get_all_policies();
    
    if ('Ok' in result) {
      // Format policies for frontend
      const formattedPolicies = result.Ok.map(policy => ({
        policyId: policy.policy_id.toString(),
        policyholder: policy.policyholder.toText(),
        premium: (Number(policy.premium) / 1e8).toFixed(8), // Convert to ICP
        coverage: (Number(policy.coverage) / 1e8).toFixed(8), // Convert to ICP
        purchaseTime: new Date(Number(policy.purchase_time) * 1000).toISOString(),
        active: policy.active,
        paidOut: policy.paid_out
      }));
      
      res.json({
        success: true,
        policies: formattedPolicies,
        count: formattedPolicies.length
      });
    } else {
      throw new Error(result.Err);
    }
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({ 
      success: false,
      error: error.message
    });
  }
});

app.get('/api/policies/stats', async (req, res) => {
  try {
    if (!canisterActor) {
      return res.status(503).json({ 
        success: false,
        error: 'ICP canister connection not available'
      });
    }
    
    const [total, active, paidOut] = await canisterActor.get_policy_stats();
    
    res.json({
      success: true,
      stats: {
        total: Number(total),
        active: Number(active),
        paidOut: Number(paidOut)
      },
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching policy stats:', error);
    res.status(500).json({ 
      success: false,
      error: error.message
    });
  }
});

app.post('/api/manual-update', async (req, res) => {
  try {
    console.log('📌 Manual update requested');
    await updateFloodData();
    res.json({ 
      success: true, 
      message: 'Flood data updated successfully',
      data: latestFloodData
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Start the server
async function startServer() {
  try {
    // Start Express server
    app.listen(PORT, () => {
      console.log(`🚀 Paramify ICP backend server running on port ${PORT}`);
      console.log(`🌐 API endpoints available:`);
      console.log(`   - GET  /api/health`);
      console.log(`   - GET  /api/flood-data`);
      console.log(`   - GET  /api/threshold`);
      console.log(`   - POST /api/threshold`);
      console.log(`   - POST /api/manual-update`);
      console.log(`   - GET  /api/policies`);
      console.log(`   - GET  /api/policies/stats`);
    });
    
    // Initialize ICP connection
    await initializeICP();
    
    // Perform initial data fetch
    await updateFloodData();
    
    // Schedule updates every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      console.log('⏰ Scheduled update triggered');
      await updateFloodData();
    });
    
    console.log(`📊 USGS data updates scheduled every 5 minutes`);
    
  } catch (error) {
    console.error('Failed to start server:', error);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

// Start the application
startServer();
```

## 4. Environment Variables

Update `.env` file:

```env
PORT=3001
ICP_CANISTER_ID=your-canister-id-here
ICP_NETWORK=local
ORACLE_PRIVATE_KEY=your-oracle-private-key-hex
```

## 5. Generate Canister Interface

You'll need to generate the JavaScript interface from the Candid file:

```bash
# Install didc tool
npm install -g didc

# Generate JS interface
didc bind icp-canister/src/paramify_insurance.did -t js > backend/paramify_insurance.did.js
```

## 6. Oracle Identity Management

For the hackathon, you can use a simple approach:

```javascript
// Generate oracle identity for testing
const { Ed25519KeyIdentity } = require('@dfinity/identity');

async function generateOracleIdentity() {
  const identity = Ed25519KeyIdentity.generate();
  const principal = identity.getPrincipal().toText();
  const privateKey = Buffer.from(identity.getKeyPair().secretKey).toString('hex');
  
  console.log('Oracle Principal:', principal);
  console.log('Private Key (save this):', privateKey);
  
  return { identity, principal, privateKey };
}

// Run this once to generate oracle credentials
// Then add the oracle principal to the canister using admin functions
```

## 7. Adding Oracle to Canister

After generating the oracle identity, add it to the canister:

```bash
# Add oracle updater (run as admin)
dfx canister call paramify_insurance add_oracle_updater '(principal "oracle-principal-here")'
```

## 8. Testing the Integration

1. Start ICP local replica:
   ```bash
   dfx start --clean
   ```

2. Deploy canister:
   ```bash
   cd icp-canister && dfx deploy
   ```

3. Generate and add oracle identity
4. Start backend service:
   ```bash
   npm start
   ```

5. Test endpoints:
   ```bash
   # Check health
   curl http://localhost:3001/api/health
   
   # Get flood data
   curl http://localhost:3001/api/flood-data
   
   # Trigger manual update
   curl -X POST http://localhost:3001/api/manual-update
   ```

## 9. Production Deployment

For mainnet:
1. Deploy canister to IC mainnet
2. Use secure key management for oracle identity
3. Update environment variables
4. Deploy backend to cloud provider (AWS, Heroku, etc.)

## 10. Key Differences from Ethereum Version

1. **No Gas Management**: ICP handles cycles internally
2. **Different Error Handling**: ICP uses Result types
3. **Identity-based Auth**: Uses Principal instead of addresses
4. **No Event Listening**: Use polling or query methods
5. **Async Pattern**: All canister calls are async

## Security Considerations

1. **Oracle Key Security**: Store private keys securely (use HSM in production)
2. **Rate Limiting**: Implement rate limiting for API endpoints
3. **Access Control**: Verify oracle principal in canister
4. **HTTPS Only**: Use HTTPS in production
5. **Monitoring**: Add logging and monitoring for oracle updates

