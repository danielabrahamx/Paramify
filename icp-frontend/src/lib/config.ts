// ICP Frontend Configuration
export const ICP_CONFIG = {
  // Canister configuration
  CANISTER_ID: 'uxrrr-q7777-77774-qaaaq-cai',
  ICP_HOST: 'http://127.0.0.1:4943',
  BACKEND_API_URL: 'http://localhost:3001',
  
  // Identity Provider configuration
  IDENTITY_PROVIDER: 'http://127.0.0.1:4943?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai',
  
  // USGS Configuration
  USGS_SITE_ID: '01646500',
  USGS_PARAMETER_CODE: '00065',
  
  // Insurance Configuration
  DEFAULT_THRESHOLD_FEET: 12.0,
  MAX_FLOOD_THRESHOLD_FEET: 100.0,
  
  // Admin principals (add your admin principal here)
  ADMIN_PRINCIPALS: [
    // Add admin principal IDs here
  ],
};

// Check if running in development
export const IS_LOCAL = ICP_CONFIG.ICP_HOST.includes('127.0.0.1') || ICP_CONFIG.ICP_HOST.includes('localhost');

// Helper function to check if a principal is admin
export const isAdminPrincipal = (principalText: string): boolean => {
  return ICP_CONFIG.ADMIN_PRINCIPALS.includes(principalText);
};
