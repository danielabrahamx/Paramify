# Paramify - Flood Insurance on ICP

A decentralized flood insurance platform built on the Internet Computer Protocol (ICP).

## Features

- **Policy Management**: Purchase, activate, and manage flood insurance policies
- **Automated Payouts**: Automatic claims processing when flood thresholds are exceeded
- **Real-time Data**: Integration with USGS flood monitoring APIs
- **Decentralized**: Runs entirely on ICP with no centralized points of failure
- **Upgradeable**: Safe canister upgrades with state preservation

## Architecture

```
Frontend -> [ICP Canister] -> [USGS API]
                  |
            [Policy Storage]
            [Fund Management]
            [Oracle Service]
```

## Deployment

### Prerequisites
- DFX 0.18.0+
- Node.js 16+
- Vessel package manager

### Local Deployment
```bash
dfx start --background
dfx deploy
```

### Mainnet Deployment
```bash
dfx deploy --network ic
```

## Usage

1. Register as a user:
```motoko
let result = await canister.register("username");
```

2. Purchase insurance:
```motoko
let result = await canister.buyInsurance(1000); // 1000 e8s coverage
```

3. Check flood status:
```motoko
let level = await canister.getCurrentFloodLevel();
```

## Testing

Run the test suite:
```bash
mo-test src/main.test.mo
```

## Documentation

- `main.did`: Candid interface definition
- `main.mo`: Core canister implementation
- `main.test.mo`: Unit tests

## License

Apache 2.0
