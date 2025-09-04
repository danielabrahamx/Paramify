# Paramify - Secure ICP Flood Insurance dApp

## 🔒 Security Enhancements Implemented

This document details the comprehensive security remediation performed on the Paramify codebase to address critical vulnerabilities and prepare it for production deployment on the Internet Computer.

## Table of Contents

- [Security Fixes](#security-fixes)
- [Quick Start](#quick-start)
- [Local Development Setup](#local-development-setup)
- [Docker Setup](#docker-setup)
- [Deployment to ICP Mainnet](#deployment-to-icp-mainnet)
- [Configuration](#configuration)
- [Architecture](#architecture)
- [Testing](#testing)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

## Security Fixes

### ✅ Phase 1: Critical Security Issues (COMPLETED)

1. **Removed Hardcoded Developer Identities**
   - Created secure deployment script (`scripts/deploy-secure.sh`)
   - All identities now loaded from environment variables
   - No PEM files or seed phrases in source code

2. **Fixed DFX Configuration**
   - Corrected canister paths and build configurations
   - Added proper Cargo workspace configuration
   - Fixed Rust canister compilation settings

3. **Updated NPM Dependencies**
   - Updated axios from 1.6.2 to 1.7.4 (security patch)
   - Added all required @dfinity packages
   - Fixed vulnerable dependencies

4. **Fixed Internet Identity Integration**
   - Created environment-aware configuration system
   - Proper IDENTITY_PROVIDER configuration
   - Secure authentication flow

### ✅ Phase 2: Architecture Improvements (COMPLETED)

1. **Environment-Aware Configuration**
   - Created `frontend/src/lib/config.ts` for centralized configuration
   - Dynamic canister ID loading based on environment
   - Proper network detection (local vs mainnet)

2. **Removed Hardcoded Admin Principals**
   - Admin principals loaded from environment variables
   - Role-based access control implementation
   - Secure admin management system

3. **Comprehensive Input Validation**
   - Created validation modules for all canisters
   - Input sanitization for all public methods
   - Rate limiting helpers
   - USGS site ID validation
   - Coverage amount validation
   - Duration validation

4. **Proper Agent/Actor Initialization**
   - Created `frontend/src/lib/agent.ts` for centralized agent management
   - Proper error handling for canister calls
   - Dynamic interface loading

### ✅ Phase 3: DevOps & Documentation (COMPLETED)

1. **Docker Containerization**
   - Multi-stage Dockerfile for development and production
   - Docker Compose setup for complete environment
   - Isolated development environment

2. **Comprehensive Documentation**
   - Setup instructions for all environments
   - Security best practices guide
   - Deployment procedures

## Quick Start

### Prerequisites

- Node.js v18+ and npm v9+
- DFX SDK v0.16.1
- Rust with wasm32-unknown-unknown target
- Docker and Docker Compose (optional)

### Environment Setup

1. Clone the repository and checkout the secure branch:
```bash
git clone https://github.com/danielabrahamx/Paramify.git
cd Paramify
git checkout icp-secure
```

2. Copy the environment template:
```bash
cp .env.example .env
```

3. Configure your `.env` file:
```bash
# Get your principal
dfx identity get-principal

# Edit .env and set:
DEPLOYER_PRINCIPAL=<your-principal>
ADMIN_PRINCIPALS=<comma-separated-admin-principals>
MINTING_PRINCIPAL=<minting-principal>
```

## Local Development Setup

### Standard Setup

1. Install dependencies:
```bash
npm install
cd frontend && npm install && cd ..
```

2. Start the local replica:
```bash
dfx start --clean --background
```

3. Deploy using the secure script:
```bash
./scripts/deploy-secure.sh
```

4. Start the frontend development server:
```bash
cd frontend
npm run dev
```

### Docker Setup (Recommended)

1. Build and start all services:
```bash
docker-compose up -d
```

2. Access services:
- Frontend: http://localhost:3000
- DFX Replica: http://localhost:4943
- Candid UI: http://localhost:8000

3. Enter development container:
```bash
docker-compose exec dev bash
```

## Deployment to ICP Mainnet

### Prerequisites

1. Create a cycles wallet:
```bash
dfx identity get-wallet --network ic
```

2. Ensure you have sufficient cycles (minimum 10T cycles recommended)

### Deployment Steps

1. Configure mainnet in `.env`:
```bash
DFX_NETWORK=ic
```

2. Build canisters:
```bash
dfx build --network ic
```

3. Create canisters on mainnet:
```bash
dfx canister create --all --network ic
```

4. Deploy canisters:
```bash
dfx deploy --network ic --with-cycles 1000000000000
```

5. Update frontend configuration with mainnet canister IDs

6. Deploy frontend to ICP:
```bash
dfx deploy frontend --network ic
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DEPLOYER_PRINCIPAL` | Principal ID of the deployer | Yes |
| `ADMIN_PRINCIPALS` | Comma-separated list of admin principals | Yes |
| `MINTING_PRINCIPAL` | Principal with minting rights | Yes |
| `DFX_NETWORK` | Network to deploy to (local/ic) | Yes |
| `USGS_SITE_ID` | USGS monitoring site ID | No |
| `UPDATE_INTERVAL_SECONDS` | Oracle update interval | No |

### Canister Configuration

Canisters are configured through initialization calls after deployment:

```bash
# Initialize Insurance canister
dfx canister call insurance initialize '(
  principal "<oracle-id>",
  principal "<payments-id>",
  vec { principal "<admin-1>"; principal "<admin-2>" }
)'

# Configure Oracle
dfx canister call oracle add_authorized_caller '(principal "<insurance-id>")'

# Configure Payments
dfx canister call payments setLedgerCanister '(principal "<ledger-id>")'
```

## Architecture

### Canisters

1. **Insurance Canister** (Motoko)
   - Policy management
   - Claims processing
   - Input validation
   - Rate limiting

2. **Oracle Canister** (Rust)
   - USGS data fetching via HTTPS outcalls
   - Data validation
   - Authorized caller management

3. **Payments Canister** (Motoko)
   - ICRC-1 token interactions
   - Premium collection
   - Payout processing
   - Escrow management

4. **ICRC-1 Ledger**
   - Token ledger (ckETH)
   - Transfer management
   - Balance tracking

### Frontend

- React 18 with TypeScript
- Vite build system
- TailwindCSS for styling
- @dfinity/agent for canister communication
- Internet Identity integration

## Testing

### Unit Tests

```bash
# Test Motoko canisters
npm run test:motoko

# Test Rust canisters
cargo test --all

# Test frontend
cd frontend && npm test
```

### Integration Tests

```bash
./scripts/run-tests.sh
```

### Using Docker

```bash
docker-compose run --rm test
```

## Security Best Practices

### For Developers

1. **Never commit sensitive data:**
   - Private keys
   - Seed phrases
   - Production principals
   - API keys

2. **Always validate input:**
   - Use the validation modules
   - Sanitize user input
   - Implement rate limiting

3. **Secure canister calls:**
   - Check caller authorization
   - Validate inter-canister calls
   - Use proper error handling

4. **Environment management:**
   - Use `.env` files for configuration
   - Never hardcode canister IDs
   - Separate dev/prod configurations

### For Deployment

1. **Identity Management:**
   - Use hardware wallets for production
   - Rotate keys regularly
   - Implement multi-sig where possible

2. **Access Control:**
   - Limit admin principals
   - Use role-based access
   - Audit access logs

3. **Monitoring:**
   - Monitor canister cycles
   - Track unusual activity
   - Set up alerts for failures

## Troubleshooting

### Common Issues

1. **DFX replica not starting:**
```bash
# Kill existing dfx processes
dfx stop
pkill dfx
# Start clean
dfx start --clean
```

2. **Canister build failures:**
```bash
# Clean build artifacts
rm -rf .dfx target
# Rebuild
dfx build
```

3. **Frontend connection issues:**
```bash
# Regenerate declarations
dfx generate
# Rebuild frontend
cd frontend && npm run build
```

4. **Docker issues:**
```bash
# Reset containers and volumes
docker-compose down -v
docker-compose up --build
```

### Getting Help

- Check the [ICP Developer Forum](https://forum.dfinity.org)
- Review [ICP Documentation](https://internetcomputer.org/docs)
- Open an issue on [GitHub](https://github.com/danielabrahamx/Paramify/issues)

## License

MIT License - See LICENSE file for details

## Contributors

- Security Remediation: ICP Security Team
- Original Development: Paramify Development Team

---

**Note:** This is a secure, production-ready version of the Paramify dApp with all critical vulnerabilities addressed. Always follow security best practices when deploying to mainnet.