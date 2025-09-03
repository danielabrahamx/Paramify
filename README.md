# Paramify: Internet Computer Flood Insurance Platform

![alt text](image.png)

## Overview

**Paramify** is a decentralized flood insurance platform built on the Internet Computer Protocol (ICP). The system provides automated insurance purchases and payouts triggered by real-time flood level data from USGS APIs. Users can purchase flood insurance policies and claim payouts when flood levels exceed predefined thresholds, with secure role-based access control.

Paramify demonstrates the power of ICP's unique features: stable memory, low-cost transactions, and direct HTTP outcalls to external APIs. The platform is fully native to the Internet Computer, providing a seamless user experience without gas fees or complex wallet management.

### Features
- **Insurance Purchase**: Users buy policies by paying a premium (10% of coverage) using ICP tokens
- **Automated Payouts**: Payouts are triggered when flood levels exceed 3 feet, automatically transferring coverage to policyholders
- **Real-Time Flood Data**: ICP canisters fetch live USGS water level data via HTTP outcalls and update automatically
- **Role-Based Access**: Admins manage the system, oracle updaters set flood levels, and users manage their policies
- **Internet Identity**: Seamless authentication using Internet Identity or Plug wallet
- **Stable Memory**: Persistent data storage that survives canister upgrades
- **Low-Cost Operations**: No gas fees - operations are powered by cycles



## Prerequisites

- **Node.js**: Version 18.x or higher
- **Rust**: Version 1.75.0 or higher
- **dfx**: DFINITY SDK (version 0.16.1 or higher)
- **Git**: To clone the repository
- **Internet Identity**: For user authentication (or Plug wallet)
- **WSL2** (Windows users): For running dfx commands


## Quick Start

### Windows Users (WSL Required)
```powershell
# 1. Enter WSL environment
wsl

# 2. Navigate to project and start ICP replica
cd /mnt/c/Users/danie/Paramify-5
dfx start --clean --background

# 3. Deploy canisters
dfx deploy

# 4. Start frontend (in new terminal)
cd frontend
npm run dev
```

### Linux/macOS Users
```bash
# 1. Start ICP replica
dfx start --clean --background

# 2. Deploy canisters
dfx deploy

# 3. Start frontend
cd frontend
npm run dev
```

The system will be available at `http://localhost:5173` with Internet Identity authentication.

## Detailed Setup Instructions

### 1. Install Prerequisites

#### Install DFX (DFINITY SDK)
```bash
# Install DFX
sh -ci "$(curl -fsSL https://sdk.dfinity.org/install.sh)"

# Add to PATH (add to ~/.bashrc or ~/.zshrc)
export PATH=$HOME/bin:$PATH

# Verify installation
dfx --version
```

#### Install Rust (if not already installed)
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Add WASM target for ICP
rustup target add wasm32-unknown-unknown
```

### 2. Clone and Setup Project
```bash
git clone https://github.com/danielabrahamx/Paramify.git
cd Paramify
git checkout icp-migration

# Install dependencies
npm install
cd frontend && npm install && cd ..
```

### 3. Start Local ICP Replica
```bash
# Start ICP replica in background
dfx start --clean --background

# Verify replica is running
dfx ping
```

### 4. Deploy Canisters
```bash
# Deploy all canisters
dfx deploy

# Check deployment status
dfx canister status --all
```

### 5. Start Frontend
```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173` with Internet Identity authentication.

## System Architecture

The Paramify system is built on ICP with the following components:

- **Insurance Canister**: Manages policies, payouts, and user data
- **Oracle Canister**: Fetches real-time USGS flood data via HTTP outcalls
- **Payments Canister**: Handles token transfers and ICRC-1 integration
- **Frontend**: React application with Internet Identity authentication
- **Stable Memory**: Persistent storage that survives canister upgrades

## Demo Instructions

### 1. Connect with Internet Identity
- Open the application at `http://localhost:5173`
- Click "Connect with Internet Identity"
- Authenticate using your Internet Identity or create a new one
- Verify: Your principal ID is displayed in the top right

### 2. Purchase Insurance Policy
- Enter coverage amount (e.g., 100 tokens)
- Click "Purchase Insurance"
- Confirm the transaction
- Verify: Policy is created with 10% premium (10 tokens)

### 3. Monitor Flood Data
- View real-time flood level from USGS API
- Check current threshold (default: 3.0 feet)
- See automatic updates every 5 minutes

### 4. Trigger Payout (Admin)
- Connect as admin user
- Update flood level above threshold (e.g., 4.0 feet)
- User can now claim payout
- Verify: Policy status changes to "Paid Out"

### 5. System Administration
- View all policies and statistics
- Update flood thresholds
- Monitor system health
- Manage oracle data sources

## Testing

### Run Canister Tests
```bash
# Test insurance canister
dfx canister call insurance get_system_status

# Test oracle canister
dfx canister call oracle get_latest_data

# Test payments canister
dfx canister call payments get_balance
```

### Integration Tests
```bash
# Run frontend tests
cd frontend
npm test

# Run E2E tests
npm run test:e2e
```

### Manual Testing Commands
```bash
# Create a policy
dfx canister call insurance create_policy '(1000000000, 10000000000)'

# Set flood level above threshold
dfx canister call oracle set_flood_level '(1600000000000)'

# Trigger payout
dfx canister call insurance trigger_payout

# Check system status
dfx canister call insurance get_system_status
```

## Project Structure

```
paramify/
├── src/
│   ├── canisters/
│   │   ├── insurance/        # Insurance canister (Motoko)
│   │   ├── oracle/           # Oracle canister (Rust)
│   │   └── payments/         # Payments canister (Motoko)
│   └── main.mo              # Main canister entry point
├── icp-canister/            # Standalone insurance canister
│   ├── src/lib.rs          # Rust implementation
│   ├── Cargo.toml          # Rust dependencies
│   └── dfx.json            # Deployment config
├── frontend/
│   ├── src/                # React frontend source
│   ├── declarations/       # Generated canister interfaces
│   └── package.json        # Frontend dependencies
├── interfaces/             # Candid interface definitions
├── dfx.json               # Main deployment configuration
├── package.json           # Root dependencies
└── README.md              # This file
```

## Security and Dependencies

- **ICP Dependencies**:
  - `@dfinity/agent`: For canister communication
  - `@dfinity/principal`: For identity management
  - `@dfinity/auth-client`: For Internet Identity integration
- **Frontend Dependencies**:
  - `react`, `typescript`, `vite`: Modern web development stack
  - `@dfinity/candid`: For type-safe canister calls
- **Security Features**:
  - Principal-based access control
  - Stable memory for data persistence
  - HTTPS outcalls for external API integration
  - Role-based permissions (admin, oracle, user)

## Future Enhancements

- **ICRC-1 Token Integration**: Full token support for premium payments and payouts
- **Multi-Location Support**: Expand to monitor multiple flood-prone areas
- **Advanced Analytics**: Historical data analysis and risk assessment
- **Mobile App**: Native mobile application with push notifications
- **Governance**: Decentralized governance for threshold and parameter updates
- **Cross-Chain**: Bridge to other blockchains for broader accessibility


## Troubleshooting

- **DFX not found:**
  - Add DFX to PATH: `export PATH=$HOME/bin:$PATH`
  - Restart terminal or run `source ~/.bashrc`
- **Replica connection failed:**
  - Stop and restart: `dfx stop && dfx start --clean`
  - Check if port 4943 is available: `lsof -i :4943`
- **Canister deployment fails:**
  - Ensure replica is running: `dfx ping`
  - Check cycles balance: `dfx wallet balance`
  - Clear build cache: `rm -rf .dfx && dfx build --clean`
- **Frontend not connecting:**
  - Verify canisters are deployed: `dfx canister status --all`
  - Check frontend is using correct canister IDs
  - Ensure Internet Identity is properly configured
- **Authentication issues:**
  - Clear browser cache and cookies
  - Try different Internet Identity provider
  - Check if local replica is running on correct port

## License

MIT License. See [LICENSE](./LICENSE) for details.

---

*Built on the Internet Computer Protocol - demonstrating the future of decentralized applications.*
