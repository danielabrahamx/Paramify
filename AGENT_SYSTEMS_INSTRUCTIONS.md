# Agent Systems Instructions for Paramify Codebase

## Overview
Paramify is a blockchain-based flood insurance protocol that uses real-time USGS water level data to automatically trigger insurance payouts when flood thresholds are exceeded. The system consists of smart contracts (Solidity), a backend service (Node.js), and frontend dashboards (React/TypeScript).

## Project Architecture

### Smart Contracts (`/contracts/`)
- **Paramify.sol**: Main insurance contract with dynamic threshold management
- **MockV3Aggregator.sol**: Chainlink-compatible oracle for testing
- **Lock.sol**: Template contract (can be ignored)

### Backend Service (`/backend/`)
- **server.js**: Express API that fetches USGS data and manages oracle updates
- Runs on port 3001 by default
- Handles USGS API integration and blockchain oracle updates

### Frontend (`/frontend/src/`)
- **InsuracleDashboard.tsx**: Customer interface for buying insurance and claiming payouts
- **InsuracleDashboardAdmin.tsx**: Admin interface for threshold management and system administration
- **lib/contract.ts**: Contract addresses and ABI definitions
- **lib/usgsApi.ts**: API client for backend services

## Critical Contract Address Management

### ⚠️ IMPORTANT: Contract addresses change on every deployment!

When Hardhat is restarted or contracts are redeployed, new addresses are generated. You MUST update:

1. **Backend configuration** (`/backend/.env`):
   ```
   PARAMIFY_ADDRESS=<NEW_CONTRACT_ADDRESS>
   MOCK_ORACLE_ADDRESS=<NEW_ORACLE_ADDRESS>
   ```

2. **Frontend configuration** (`/frontend/src/lib/contract.ts`):
   ```typescript
   export const PARAMIFY_ADDRESS = '<NEW_CONTRACT_ADDRESS>';
   export const MOCK_ORACLE_ADDRESS = '<NEW_ORACLE_ADDRESS>';
   ```

### Deployment Workflow
1. Start Hardhat node: `npx hardhat node`
2. Deploy contracts: `npx hardhat run scripts/deploy.js --network localhost`
3. Update contract addresses in both backend and frontend
4. Restart backend service
5. Frontend will hot-reload automatically

## User Roles & Dashboards

### Customer Dashboard (InsuracleDashboard.tsx)
- **Purpose**: End-user interface for flood insurance
- **Features**:
  - Buy insurance policies (pay premium, set coverage amount)
  - View current flood levels vs. threshold
  - Claim payouts when conditions are met
  - Monitor real-time USGS water data
- **Target Users**: Insurance customers
- **Key Functions**: `handleBuyInsurance()`, `handleTriggerPayout()`

### Admin Dashboard (InsuracleDashboardAdmin.tsx)
- **Purpose**: Insurance company/admin interface
- **Features**:
  - Manage flood thresholds dynamically
  - Fund the insurance contract
  - Monitor system status and USGS data
  - View contract balances and user policies
- **Access Control**: Only specific admin wallet (0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266)
- **Key Functions**: `handleUpdateThreshold()`, `handleFundContract()`

## Data Flow & Unit Conversions

### Scaling Formula
The system uses a scaling factor of **100,000,000,000** to convert between human-readable feet and contract units:

```
Contract Units = Feet × 100,000,000,000

Examples:
- 4.24 ft = 424,000,000,000 units
- 12 ft = 1,200,000,000,000 units
```

### Data Sources
1. **USGS API**: Real-time water level data in feet
2. **Backend Processing**: Converts feet to contract units and updates oracle
3. **Smart Contract**: Stores and compares values in contract units
4. **Frontend Display**: Converts back to feet for user-friendly display

## Network Configuration

### Local Development (Hardhat)
- **Chain ID**: 31337
- **RPC URL**: http://localhost:8545
- **Admin Account**: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
- **Private Key**: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

### GitHub Codespaces
- **RPC URL**: https://expert-couscous-4j6674wqj9jr2q7xx-8545.app.github.dev
- Frontend and backend URLs are dynamically generated based on Codespace

## Common Development Patterns

### When Editing UI Components
- Always maintain consistency between customer and admin dashboards
- Use the same unit conversion patterns across both interfaces
- Ensure responsive design and proper error handling

### When Updating Smart Contracts
1. Make changes to `/contracts/Paramify.sol`
2. Update ABI in `/frontend/src/lib/contract.ts` if needed
3. Redeploy and update addresses
4. Test on both dashboards

### When Modifying Backend APIs
- Update TypeScript interfaces in `/frontend/src/lib/usgsApi.ts`
- Ensure error handling for blockchain connectivity issues
- Test USGS API integration separately

## Testing Workflow

### Complete System Test
1. **Deploy fresh contracts** and update addresses
2. **Start backend**: `cd backend && npm start`
3. **Start frontend**: `cd frontend && npm run dev`
4. **Test customer flow**: Buy insurance, wait for threshold trigger, claim payout
5. **Test admin flow**: Update threshold, fund contract, monitor system

### Threshold Testing
- Set threshold below current USGS level to trigger payout conditions
- Test with various threshold values (common range: 4-15 feet)
- Verify immediate UI updates after threshold changes

## Environment Management

### Required Services
- **Hardhat Node**: Must be running on port 8545
- **Backend Service**: Must be running on port 3001
- **Frontend Dev Server**: Typically port 5173 (Vite) or 3000

### Service Dependencies
- Frontend depends on backend for USGS data
- Backend depends on Hardhat node for blockchain interaction
- All services can gracefully handle temporary disconnections

## Security Considerations

### Access Control
- Only contract owner can update flood threshold
- Admin wallet verification in frontend
- Input validation for all numeric inputs (thresholds, amounts)

### Error Handling
- Always handle blockchain connectivity issues
- Provide user-friendly error messages
- Implement transaction timeout handling
- Graceful degradation when services are unavailable

## Common Issues & Solutions

### "Contract not found" errors
- Verify contract addresses match deployed contracts
- Restart backend service after address updates
- Check Hardhat node is running and accessible

### USGS data not updating
- Check backend console for API errors
- Verify backend service is running
- Use manual update feature in admin dashboard

### MetaMask connection issues
- Ensure correct network (Chain ID 31337)
- Check account has sufficient ETH for gas
- Verify contract addresses in frontend config

### Threshold updates failing
- Confirm admin wallet is connected
- Check backend service connectivity
- Verify input validation (positive numbers, reasonable limits)

### UI Display Reverting to Units Instead of Feet (Added: 2025-06-25)
**Problem**: Admin dashboard flood level occasionally displays raw contract units instead of user-friendly feet format
**Cause**: Inconsistent data updates or state management between customer actions and admin dashboard
**Solution**: 
1. Ensure both dashboards use the same conversion formula: `(floodLevel / 100000000000).toFixed(2) ft`
2. Verify state updates are consistent across components
3. Check that USGS data updates don't override the display format
**Prevention**: Always use the feet display format as primary with units as secondary reference

## File Structure Reference

```
/contracts/
├── Paramify.sol              # Main insurance contract
├── mocks/
│   └── MockV3Aggregator.sol  # Test oracle

/backend/
├── server.js                 # Main backend service
└── .env                      # Contract addresses & config

/frontend/src/
├── InsuracleDashboard.tsx         # Customer interface
├── InsuracleDashboardAdmin.tsx    # Admin interface
└── lib/
    ├── contract.ts           # Contract addresses & ABIs
    └── usgsApi.ts           # Backend API client

/scripts/
├── deploy.js                 # Contract deployment
└── deployMock.js            # Oracle deployment

Documentation/
├── THRESHOLD_DEPLOYMENT_GUIDE.md  # Deployment procedures
├── USGS_INTEGRATION_GUIDE.md      # API integration guide
└── AGENT_SYSTEMS_INSTRUCTIONS.md  # This file
```

## Key API Endpoints

### Backend APIs
- `GET /api/health` - Service health check
- `GET /api/status` - Complete system status
- `GET /api/threshold` - Current threshold data
- `POST /api/threshold` - Update threshold (admin only)
- `GET /api/flood-data` - USGS flood data
- `POST /api/manual-update` - Force USGS data refresh

### External APIs
- **USGS**: https://waterservices.usgs.gov/nwis/iv/ (Site: 01646500, Parameter: 00065)

## Development Best Practices

### When Making Changes
1. Always test on both customer and admin dashboards
2. Verify unit conversions are consistent
3. Update relevant documentation
4. Test with both connected and disconnected states
5. Ensure graceful error handling

### Code Consistency
- Use the same scaling factor (100,000,000,000) everywhere
- Maintain consistent error message formatting
- Follow the established TypeScript patterns
- Keep UI components visually consistent

### Git Workflow
- Commit contract address updates separately from feature changes
- Include deployment instructions in commit messages
- Update relevant documentation files with each change

---

## Quick Reference Commands

```bash
# Start Hardhat node
npx hardhat node

# Deploy contracts
npx hardhat run scripts/deploy.js --network localhost

# Start backend
cd backend && npm start

# Start frontend
cd frontend && npm run dev

# Check contract balances
npx hardhat run scripts/check-balance.js --network localhost
```

---

## Instructions for AI Agents: Maintaining This Document

### ⚠️ IMPORTANT: Autonomous Documentation Updates Required

**Any AI agent working on this codebase MUST update this file when they discover:**

1. **New bugs or issues** not covered in the troubleshooting section
2. **Better development patterns** or more efficient workflows
3. **Missing critical information** that would help future agents
4. **Changes to the architecture** or new features added
5. **Updated dependencies** or environment requirements
6. **New testing procedures** or deployment steps
7. **Security considerations** not previously documented

### How to Update This File

When you discover something new, add it to the appropriate section:

- **Bugs/Issues** → Add to "Common Issues & Solutions"
- **New workflows** → Add to "Development Best Practices" or "Testing Workflow"
- **Architecture changes** → Update "Project Architecture" section
- **New APIs/endpoints** → Update "Key API Endpoints"
- **Environment changes** → Update "Environment Management" or "Network Configuration"

### Documentation Standards

- Use clear, actionable language
- Include code examples where helpful
- Reference specific file paths and line numbers when relevant
- Add timestamps for significant architectural changes
- Maintain the existing formatting and structure

### Example Update Pattern

```markdown
### [New Issue Title] (Added: 2025-06-25)
**Problem**: Brief description of the issue
**Cause**: Why it happens
**Solution**: Step-by-step fix
**Prevention**: How to avoid in the future
```

**Remember**: This documentation is a living document that should evolve with the codebase. Your insights help future agents work more efficiently and avoid repeating the same discoveries.

---

This file should be consulted before making any significant changes to the Paramify system. Keep it updated as the project evolves and your discoveries will benefit all future AI agents working on this project.
