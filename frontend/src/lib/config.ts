// Configuration for canister IDs and network settings
// This file handles environment-aware configuration

interface CanisterIds {
  insurance: string;
  oracle: string;
  payments: string;
  icrc1_ledger: string;
  frontend: string;
}

// Try to load canister IDs from environment or canister_ids.json
const loadCanisterIds = (): CanisterIds => {
  // Check if running in development with env variables
  if (import.meta.env.VITE_INSURANCE_CANISTER_ID) {
    return {
      insurance: import.meta.env.VITE_INSURANCE_CANISTER_ID,
      oracle: import.meta.env.VITE_ORACLE_CANISTER_ID,
      payments: import.meta.env.VITE_PAYMENTS_CANISTER_ID,
      icrc1_ledger: import.meta.env.VITE_ICRC1_LEDGER_CANISTER_ID,
      frontend: import.meta.env.VITE_FRONTEND_CANISTER_ID,
    };
  }

  // Default local development canister IDs (will be replaced during deployment)
  // These are placeholder values that will be updated by the deployment script
  return {
    insurance: process.env.INSURANCE_CANISTER_ID || '',
    oracle: process.env.ORACLE_CANISTER_ID || '',
    payments: process.env.PAYMENTS_CANISTER_ID || '',
    icrc1_ledger: process.env.ICRC1_LEDGER_CANISTER_ID || '',
    frontend: process.env.FRONTEND_CANISTER_ID || '',
  };
};

// Network configuration
export const NETWORK = import.meta.env.VITE_DFX_NETWORK || 'local';
export const IS_LOCAL = NETWORK === 'local';
export const IS_MAINNET = NETWORK === 'ic';

// Host configuration
export const HOST = IS_LOCAL 
  ? `http://127.0.0.1:${import.meta.env.VITE_REPLICA_PORT || '4943'}`
  : 'https://icp-api.io';

// Identity Provider configuration
export const IDENTITY_PROVIDER = IS_LOCAL
  ? `${HOST}?canisterId=${import.meta.env.VITE_INTERNET_IDENTITY_CANISTER_ID || 'rdmx6-jaaaa-aaaaa-aaadq-cai'}`
  : 'https://identity.ic0.app';

// Canister IDs
export const CANISTER_IDS = loadCanisterIds();

// Admin configuration - loaded from environment
export const ADMIN_PRINCIPALS = (
  import.meta.env.VITE_ADMIN_PRINCIPALS || 
  process.env.ADMIN_PRINCIPALS || 
  ''
).split(',').map((p: string) => p.trim()).filter(Boolean);

// Check if a principal is an admin
export const isAdminPrincipal = (principalText: string): boolean => {
  return ADMIN_PRINCIPALS.includes(principalText);
};

// USGS Configuration
export const USGS_CONFIG = {
  siteId: import.meta.env.VITE_USGS_SITE_ID || '01646500',
  parameterCode: import.meta.env.VITE_USGS_PARAMETER_CODE || '00065',
  updateIntervalSeconds: parseInt(
    import.meta.env.VITE_UPDATE_INTERVAL_SECONDS || '300'
  ),
};

// Insurance Configuration  
export const INSURANCE_CONFIG = {
  defaultThresholdFeet: parseFloat(
    import.meta.env.VITE_DEFAULT_THRESHOLD_FEET || '3.0'
  ),
  premiumPercentage: parseInt(
    import.meta.env.VITE_PREMIUM_PERCENTAGE || '10'
  ),
  maxCoverageTokens: BigInt(
    import.meta.env.VITE_MAX_COVERAGE_TOKENS || '10000'
  ),
  minCoverageTokens: BigInt(
    import.meta.env.VITE_MIN_COVERAGE_TOKENS || '1'
  ),
};

// Token Configuration
export const TOKEN_CONFIG = {
  symbol: 'ckETH',
  name: 'Chain Key Ethereum',
  decimals: 8,
  transferFee: BigInt(10000), // 0.0001 tokens
};

// Export validation function to check if configuration is complete
export const validateConfiguration = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!CANISTER_IDS.insurance) errors.push('Insurance canister ID not configured');
  if (!CANISTER_IDS.oracle) errors.push('Oracle canister ID not configured');
  if (!CANISTER_IDS.payments) errors.push('Payments canister ID not configured');
  if (!CANISTER_IDS.icrc1_ledger) errors.push('ICRC1 Ledger canister ID not configured');
  if (!CANISTER_IDS.frontend) errors.push('Frontend canister ID not configured');

  if (ADMIN_PRINCIPALS.length === 0) {
    errors.push('No admin principals configured');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};