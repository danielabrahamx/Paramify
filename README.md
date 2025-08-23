# Paramify - Insurance dApp

A decentralized insurance application built on the Internet Computer (IC) with React frontend.

## Architecture

### Backend (IC Canisters)
- **paramify_core**: Core insurance logic, policy management, and business rules
- **paramify_oracle**: Flood data oracle with automated updates and core integration
- **paramify_frontend**: Asset canister serving the React frontend

### Frontend
- **React + TypeScript**: Modern UI with shadcn/ui components
- **Vite**: Fast build tool and development server
- **Tailwind CSS**: Utility-first CSS framework

## Prerequisites

- **dfx**: Internet Computer development kit (version 0.18.0+)
- **Node.js**: For frontend development
- **Ubuntu/WSL**: Recommended for dfx compatibility

## Quick Start

### 1. Start Local IC Replica
```bash
dfx start --clean --background
```

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 3. Build Frontend
```bash
npm run build
```

### 4. Deploy Canisters
```bash
# Deploy core and oracle canisters
dfx deploy paramify_core
dfx deploy paramify_oracle

# Deploy frontend canister (after building)
dfx canister install paramify_frontend --mode reinstall
```

### 5. Access Your dApp
- **Frontend**: `http://127.0.0.1:4943/?canisterId=<FRONTEND_CANISTER_ID>`
- **Candid UI (Core)**: `http://127.0.0.1:4943/?canisterId=<UI_CANISTER_ID>&id=<CORE_CANISTER_ID>`
- **Candid UI (Oracle)**: `http://127.0.0.1:4943/?canisterId=<UI_CANISTER_ID>&id=<ORACLE_CANISTER_ID>`

## Development

### Building Canisters
```bash
dfx build
```

### Testing Canisters
```bash
dfx test
```

### Frontend Development
```bash
cd frontend
npm run dev
```

## Canister Functions

### paramify_core
- `buyInsurance(coverage: Nat, duration: Nat)`: Purchase insurance policy
- `claimPayout(policyId: Principal)`: Claim payout if flood threshold met
- `addAdmin(newAdmin: Principal)`: Add new admin
- `setFloodThreshold(threshold: Nat)`: Set flood level threshold
- `getPolicy(policyId: Principal)`: Get policy details

### paramify_oracle
- `setCoreCanisterId(id: Text)`: Set core canister ID for integration
- `startUpdates()`: Start automatic flood level updates
- `manualUpdate()`: Trigger manual flood level update
- `getLatestFloodData()`: Get current flood level

## Configuration

The `dfx.json` file configures:
- Canister types and dependencies
- Build commands for frontend
- Network settings

## Migration from Ethereum

This project demonstrates migrating from Ethereum/Hardhat to IC while preserving:
- React frontend architecture
- Business logic (moved to Motoko canisters)
- User experience and UI components

The IC provides:
- Lower transaction costs
- Faster finality
- Native integration with web technologies
- Scalable backend infrastructure

## Troubleshooting

### Common Issues
1. **dfx not found**: Ensure dfx is installed and in PATH
2. **Build failures**: Check frontend dependencies are installed
3. **Canister deployment errors**: Verify local replica is running

### Useful Commands
```bash
dfx canister status --all          # Check canister status
dfx canister info <CANISTER_NAME>  # Get canister details
dfx stop                           # Stop local replica
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

[Add your license here]
