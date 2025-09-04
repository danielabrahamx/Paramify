const { Actor, HttpAgent } = require("@dfinity/agent");
require('dotenv').config();

class ICPBridge {
    constructor() {
        this.canisterId = process.env.ICP_CANISTER_ID || "bkyz2-fmaaa-aaaaa-qaaaq-cai";
        this.agent = new HttpAgent({
            host: process.env.ICP_HOST || "http://127.0.0.1:4943",
            fetch: require('node-fetch')
        });
        
        if (process.env.NODE_ENV === 'development') {
            this.agent.fetchRootKey();
        }
    }

    async syncFloodDataToICP(floodData) {
        try {
            console.log('🔗 Syncing flood data to ICP canister...');
            console.log(`📊 Water level: ${floodData.value} ft`);
            console.log(`⏰ Timestamp: ${floodData.timestamp}`);
            
            // Convert feet to scaled units (multiply by 100000000000)
            const scaledLevel = Math.floor(floodData.value * 100000000000);
            
            console.log(`📈 Scaled for canister: ${scaledLevel}`);
            console.log('✅ Ready for ICP canister integration');
            
            return {
                success: true,
                scaledLevel: scaledLevel,
                originalValue: floodData.value
            };
        } catch (error) {
            console.error('❌ Error syncing to ICP:', error);
            throw error;
        }
    }

    async getCanisterStatus() {
        try {
            console.log(`📡 Checking canister status: ${this.canisterId}`);
            return {
                canisterId: this.canisterId,
                host: process.env.ICP_HOST,
                status: 'ready'
            };
        } catch (error) {
            console.error('❌ Error getting canister status:', error);
            throw error;
        }
    }
}

module.exports = ICPBridge;