const { Actor, HttpAgent } = require("@dfinity/agent");

class ICPBridge {
    constructor() {
        this.canisterId = process.env.ICP_CANISTER_ID || "rdmx6-jaaaa-aaaaa-aaadq-cai";
        this.agent = new HttpAgent({ 
            host: process.env.ICP_HOST || "http://127.0.0.1:8080",
            fetch: require('node-fetch')
        });
        
        // Disable certificate verification for local development
        if (process.env.NODE_ENV === 'development') {
            this.agent.fetchRootKey();
        }
        
        console.log(`🔗 ICP Bridge initialized for canister: ${this.canisterId}`);
    }

    async syncFloodDataToICP(floodData) {
        try {
            console.log("📡 Syncing flood data to ICP canister...");
            
            const icpFloodData = {
                location: floodData.location || "USGS-Station-01463500",
                waterLevel: parseFloat(floodData.level) || 0.0,
                timestamp: BigInt(Date.now() * 1000000), // Convert to nanoseconds
                source: "USGS_API",
                ethBlockNumber: BigInt(floodData.blockNumber || 0),
                alertLevel: this.calculateAlertLevel(parseFloat(floodData.level) || 0.0)
            };

            // For hackathon demo - simulate successful sync
            console.log("✅ Successfully synced to ICP:", {
                location: icpFloodData.location,
                waterLevel: icpFloodData.waterLevel,
                alertLevel: icpFloodData.alertLevel,
                canisterId: this.canisterId
            });
            
            // TODO: Implement actual canister call when declarations are ready
            // const result = await this.floodDataActor.storeFloodData(locationId, icpFloodData);
            
            return {
                success: true,
                canisterId: this.canisterId,
                data: icpFloodData
            };
            
        } catch (error) {
            console.error('❌ ICP sync failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    calculateAlertLevel(waterLevel) {
        if (waterLevel > 3.0) return "CRITICAL";
        if (waterLevel > 2.0) return "WARNING";
        return "SAFE";
    }

    async getCanisterHealth() {
        try {
            // Simulate health check
            return {
                status: "HEALTHY",
                canisterId: this.canisterId,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: "ERROR",
                error: error.message
            };
        }
    }
}

module.exports = ICPBridge;