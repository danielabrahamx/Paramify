const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { ethers } = require('ethers');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Contract addresses and ABIs
const PARAMIFY_ADDRESS = process.env.PARAMIFY_ADDRESS;
const MOCK_ORACLE_ADDRESS = process.env.MOCK_ORACLE_ADDRESS;

// Mock Oracle ABI (only the functions we need)
const MOCK_ORACLE_ABI = [
  {
    "inputs": [
      {
        "internalType": "int256",
        "name": "_answer",
        "type": "int256"
      }
    ],
    "name": "updateAnswer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "latestAnswer",
    "outputs": [
      {
        "internalType": "int256",
        "name": "",
        "type": "int256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// USGS API configuration
const USGS_SITE_ID = '01646500'; // Potomac River Near Wash, DC Little Falls Pump Sta
const USGS_PARAMETER_CODE = '00065'; // Gage height in feet
const USGS_API_URL = `https://waterservices.usgs.gov/nwis/iv/?format=json&sites=${USGS_SITE_ID}&parameterCd=${USGS_PARAMETER_CODE}&siteStatus=all`;

// Middleware
app.use(cors());
app.use(express.json());

// Global variables to store latest data
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

// Initialize Ethereum provider and signer
let provider;
let signer;
let mockOracleContract;

async function initializeEthers() {
  try {
    // Connect to local Hardhat node with timeout
    provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    
    // Test connection with timeout
    const network = await Promise.race([
      provider.getNetwork(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 5000))
    ]);
    
    // Use the first Hardhat account (admin account)
    const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
    signer = new ethers.Wallet(privateKey, provider);
    
    // Initialize contract instance
    mockOracleContract = new ethers.Contract(MOCK_ORACLE_ADDRESS, MOCK_ORACLE_ABI, signer);
    
    console.log('✅ Ethereum provider initialized');
    console.log('Connected to:', await signer.getAddress());
    console.log('Network:', network.name, 'Chain ID:', network.chainId.toString());
  } catch (error) {
    console.warn('⚠️  Could not connect to blockchain immediately:', error.message);
    console.log('📡 Backend will continue running for USGS data fetching');
    console.log('🔄 Blockchain connection will be retried when needed');
    latestFloodData.status = 'partial';
    latestFloodData.error = 'Blockchain connection pending';
  }
}

// Function to fetch USGS data
async function fetchUSGSData() {
  try {
    console.log('🌊 Fetching USGS water level data...');
    
    const response = await axios.get(USGS_API_URL);
    const data = response.data;
    
    // Parse the nested JSON structure
    const timeSeries = data.value.timeSeries[0];
    const latestValue = timeSeries.values[0].value[0];
    
    // Extract the water level value (in feet)
    const waterLevelFeet = parseFloat(latestValue.value);
    const timestamp = latestValue.dateTime;
    
    console.log(`📊 Latest water level: ${waterLevelFeet} ft at ${timestamp}`);
    
    // Update global data
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

// Function to update the oracle contract
async function updateOracleContract(waterLevel) {
  try {
    // Check if we have a valid contract connection
    if (!mockOracleContract || !signer) {
      console.log('🔄 Attempting to reconnect to blockchain...');
      await initializeEthers();
      
      if (!mockOracleContract) {
        throw new Error('Could not establish blockchain connection');
      }
    }
    
    // Convert water level to the format expected by the contract
    // The contract expects values with 8 decimal places
    // We'll multiply by 1000 to convert feet to a larger unit for the threshold comparison
    const scaledValue = Math.floor(waterLevel * 1000 * 1e8);
    
    console.log(`🔄 Updating oracle with scaled value: ${scaledValue} (${waterLevel * 1000} units)`);
    
    // Get current gas price
    const gasPrice = await provider.getFeeData();
    
    // Update the oracle
    const tx = await mockOracleContract.updateAnswer(scaledValue, {
      gasPrice: gasPrice.gasPrice
    });
    
    console.log(`📝 Transaction sent: ${tx.hash}`);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`✅ Oracle updated successfully! Block: ${receipt.blockNumber}`);
    
    // Verify the update
    const newValue = await mockOracleContract.latestAnswer();
    console.log(`🔍 Verified oracle value: ${newValue.toString()}`);
    
    return receipt;
  } catch (error) {
    console.error('❌ Error updating oracle:', error.message);
    // Don't throw the error - let the system continue with just USGS data
    latestFloodData.error = `Oracle update failed: ${error.message}`;
    return null;
  }
}

// Main update function
async function updateFloodData() {
  try {
    console.log('\n🚀 Starting flood data update...');
    
    // Fetch latest USGS data
    const waterLevel = await fetchUSGSData();
    
    // Try to update the oracle contract (non-blocking)
    const receipt = await updateOracleContract(waterLevel);
    
    if (receipt) {
      console.log('✅ Flood data update completed successfully!\n');
      latestFloodData.status = 'active';
      latestFloodData.error = null;
    } else {
      console.log('⚠️  USGS data updated, but oracle update failed\n');
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
    message: 'Paramify backend service is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/flood-data', (req, res) => {
  res.json(latestFloodData);
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

app.get('/api/status', async (req, res) => {
  try {
    // Get current oracle value
    let oracleValue = null;
    if (mockOracleContract) {
      const rawValue = await mockOracleContract.latestAnswer();
      oracleValue = Number(rawValue) / 1e8 / 1000; // Convert back to feet
    }
    
    res.json({
      service: 'active',
      lastUpdate: latestFloodData.lastUpdate,
      currentFloodLevel: latestFloodData.value,
      oracleValue: oracleValue,
      dataSource: latestFloodData.source,
      site: latestFloodData.siteInfo,
      updateInterval: '5 minutes',
      nextUpdate: latestFloodData.lastUpdate ? 
        new Date(new Date(latestFloodData.lastUpdate).getTime() + 5 * 60 * 1000).toISOString() : 
        null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server
async function startServer() {
  try {
    // Start Express server first
    app.listen(PORT, () => {
      console.log(`🚀 Paramify backend server running on port ${PORT}`);
      console.log(`🌐 API endpoints available:`);
      console.log(`   - GET  /api/health`);
      console.log(`   - GET  /api/flood-data`);
      console.log(`   - GET  /api/status`);
      console.log(`   - POST /api/manual-update`);
    });
    
    // Initialize Ethereum connection (non-blocking)
    await initializeEthers();
    
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
    // Don't exit - let the server run even if blockchain connection fails
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  process.exit(0);
});

// Start the application
startServer();
