# Paramify Codebase Export for LLM Analysis

## Project Overview
Paramify is a blockchain-based flood insurance protocol that uses real-time USGS water level data to automatically trigger insurance payouts when flood thresholds are exceeded. The system consists of smart contracts (Solidity), a backend service (Node.js), and frontend dashboards (React/TypeScript) with NFT-based policy management.

## Architecture Summary
- **Smart Contracts**: Solidity contracts for insurance logic and NFT policy management
- **Backend**: Node.js Express server for USGS API integration and blockchain interaction
- **Frontend**: React/TypeScript dashboards for customers and admins
- **NFT System**: ERC-721 soulbound tokens representing insurance policies

---

## Smart Contracts

### Main Contract: contracts/Paramify.sol
```solidity
[CONTRACT_CONTENT_PLACEHOLDER]
```

### Mock Oracle: contracts/mocks/MockV3Aggregator.sol
```solidity
[MOCK_CONTRACT_PLACEHOLDER]
```

---

## Backend Service

### Main Server: backend/server.js
```javascript
[BACKEND_SERVER_PLACEHOLDER]
```

### Environment Config: backend/.env
```
[BACKEND_ENV_PLACEHOLDER]
```

### Package Config: backend/package.json
```json
[BACKEND_PACKAGE_PLACEHOLDER]
```

---

## Frontend Application

### Customer Dashboard: frontend/src/InsuracleDashboard.tsx
```typescript
[CUSTOMER_DASHBOARD_PLACEHOLDER]
```

### Admin Dashboard: frontend/src/InsuracleDashboardAdmin.tsx
```typescript
[ADMIN_DASHBOARD_PLACEHOLDER]
```

### Contract Configuration: frontend/src/lib/contract.ts
```typescript
[CONTRACT_CONFIG_PLACEHOLDER]
```

### API Client: frontend/src/lib/usgsApi.ts
```typescript
[API_CLIENT_PLACEHOLDER]
```

### Main App: frontend/src/App.tsx
```typescript
[MAIN_APP_PLACEHOLDER]
```

### Package Config: frontend/package.json
```json
[FRONTEND_PACKAGE_PLACEHOLDER]
```

---

## Deployment Scripts

### Main Deployment: scripts/deploy.js
```javascript
[DEPLOY_SCRIPT_PLACEHOLDER]
```

### Mock Deployment: scripts/deployMock.js
```javascript
[DEPLOY_MOCK_PLACEHOLDER]
```

---

## Configuration Files

### Hardhat Config: hardhat.config.js
```javascript
[HARDHAT_CONFIG_PLACEHOLDER]
```

### Root Package: package.json
```json
[ROOT_PACKAGE_PLACEHOLDER]
```

---

## Documentation

### Agent Instructions: AGENT_SYSTEMS_INSTRUCTIONS.md
```markdown
[AGENT_INSTRUCTIONS_PLACEHOLDER]
```

### README: README.md
```markdown
[README_PLACEHOLDER]
```

---

## Key Features & Implementation Notes

### NFT Policy System
- Each insurance policy is minted as an ERC-721 NFT
- NFTs are soulbound (non-transferable after minting)
- Policy details stored on-chain in NFT metadata
- Real-time metadata updates when policy status changes
- SVG-based visual representation of policy status

### Data Flow
1. USGS API provides real-time water level data in feet
2. Backend converts feet to contract units (×100,000,000,000) and updates oracle
3. Smart contract stores and compares values in contract units
4. Frontend converts back to feet for user-friendly display

### Security Features
- Only contract owner can update flood threshold
- Admin wallet verification in frontend
- Input validation for all numeric inputs
- Comprehensive error handling and timeout management

### Testing & Deployment
- 4-terminal workflow: Hardhat node, contract deployment, backend, frontend
- Contract addresses must be updated after every deployment
- Comprehensive troubleshooting guide for common issues

---

*This export was generated on June 29, 2025 from the NFT branch of the Paramify repository.*
