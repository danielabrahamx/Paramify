// Backend API endpoints (not direct ICP calls)
const BACKEND_API_URL = 'http://172.27.83.17:3001/api';

export interface FloodData {
  value: number | null;
  timestamp: string | null;
  lastUpdate: string | null;
  status: string;
  error: string | null;
  source: string;
  siteInfo: {
    name: string;
    siteId: string;
  };
}

export interface ServiceStatus {
  service: string;
  lastUpdate: string | null;
  currentFloodLevel: number | null;
  oracleValue: number | null;
  dataSource: string;
  site: {
    name: string;
    siteId: string;
  };
  updateInterval: string;
  nextUpdate: string | null;
  threshold?: {
    thresholdFeet: number;
    thresholdUnits: number;
  };
}

export const usgsApi = {
  async getFloodData(): Promise<FloodData> {
    try {
      // Call the backend API instead of direct ICP calls
      const response = await fetch(`${BACKEND_API_URL}/flood-data`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        value: data.value,
        timestamp: data.timestamp,
        lastUpdate: data.lastUpdate,
        status: data.status,
        error: data.error,
        source: data.source,
        siteInfo: data.siteInfo
      };
    } catch (error) {
      console.error('Error fetching flood data from backend API:', error);
      return {
        value: null,
        timestamp: null,
        lastUpdate: null,
        status: "error",
        error: error instanceof Error ? error.message : 'Unknown error',
        source: "Backend API",
        siteInfo: {
          name: "Mississippi River at Memphis",
          siteId: "07032000"
        }
      };
    }
  },

  async getStatus(): Promise<ServiceStatus> {
    try {
      // Call the backend API status endpoint
      const response = await fetch(`${BACKEND_API_URL}/status`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      return {
        service: data.service,
        lastUpdate: data.lastUpdate,
        currentFloodLevel: data.currentFloodLevel,
        oracleValue: data.oracleValue,
        dataSource: data.dataSource,
        site: data.site,
        updateInterval: data.updateInterval,
        nextUpdate: data.nextUpdate,
        threshold: data.threshold
      };
    } catch (error) {
      console.error('Error fetching service status from backend API:', error);
      return {
        service: "ICP Flood Insurance Oracle",
        lastUpdate: null,
        currentFloodLevel: null,
        oracleValue: null,
        dataSource: "USGS API via ICP Oracle",
        site: {
          name: "Mississippi River at Memphis",
          siteId: "07032000"
        },
        updateInterval: "5 minutes",
        nextUpdate: null,
        threshold: {
          thresholdFeet: 12,
          thresholdUnits: 1200000000000
        }
      };
    }
  },

  async triggerManualUpdate(): Promise<{ success: boolean; message: string; data: FloodData }> {
    try {
      const response = await fetch(`${BACKEND_API_URL}/manual-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return {
        success: result.success,
        message: result.message,
        data: await this.getFloodData()
      };
    } catch (error) {
      console.error('Error triggering manual update:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Update failed',
        data: await this.getFloodData()
      };
    }
  },

  async checkHealth(): Promise<{ status: string; message: string; timestamp: string }> {
    try {
      const response = await fetch(`${BACKEND_API_URL}/health`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      return {
        status: result.status,
        message: result.message,
        timestamp: result.timestamp
      };
    } catch (error) {
      console.error('Error checking backend API health:', error);
      return {
        status: "error",
        message: `Backend API communication failed: ${error}`,
        timestamp: new Date().toISOString()
      };
    }
  },
};

// Helper function to format the timestamp
export function formatTimestamp(timestamp: string | null): string {
  if (!timestamp) return 'N/A';
  
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// Helper function to format the next update time
export function getTimeUntilNextUpdate(nextUpdate: string | null): string {
  if (!nextUpdate) return 'N/A';
  
  const now = new Date();
  const next = new Date(nextUpdate);
  const diffMs = next.getTime() - now.getTime();
  
  if (diffMs < 0) return 'Updating...';
  
  const minutes = Math.floor(diffMs / 60000);
  const seconds = Math.floor((diffMs % 60000) / 1000);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
