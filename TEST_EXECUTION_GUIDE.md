# ICP Flood Insurance Dapp - Test Execution Guide

## Quick Start

### 1. Local Testing (Recommended for Development)

```bash
# Start local network
dfx start --background

# Deploy canisters
dfx deploy

# Run comprehensive test suite
./scripts/run-tests.sh

# Or run manually
dfx canister call main-test runTests
```

### 2. Testnet Testing (Production Validation)

```bash
# Deploy to testnet
./scripts/deploy-testnet.sh

# Run tests on testnet
./scripts/run-tests.sh testnet
```

## Test Suite Overview

### Coverage: 8 Test Suites, 40+ Tests

| Suite | Tests | Description |
|-------|-------|-------------|
| **Canister Initialization** | 4 | Owner auth, admin management |
| **Contract Funding** | 5 | Funding, balance, thresholds |
| **User Management** | 3 | Registration, validation |
| **Policy Lifecycle** | 7 | Creation, activation, premium |
| **Flood Monitoring** | 4 | Data updates, conversions |
| **Payout Logic** | 5 | Eligibility, execution |
| **Auto Payouts** | 2 | Batch processing |
| **Statistics** | 2 | Reporting, monitoring |
| **Error Handling** | 3 | Edge cases, validation |

## Expected Test Results

### ✅ All Tests Should Pass

```
🧪 Running ICP Flood Insurance Dapp Test Suite
==========================================
📊 Test Results:
==========================================
All tests passed! End-to-end functionality verified successfully.
==========================================
✅ All tests passed successfully!
🎉 End-to-end functionality verified!
```

### ❌ If Tests Fail

Common failure points and solutions:

1. **Authentication Errors**
   ```bash
   # Check identity
   dfx identity whoami
   
   # Create new identity if needed
   dfx identity new test-identity
   dfx identity use test-identity
   ```

2. **Network Issues**
   ```bash
   # Check network config
   dfx config --local network
   
   # Reset to local
   dfx config --local network local
   ```

3. **Canister State Issues**
   ```bash
   # Reset deployment
   dfx stop
   dfx start --clean --background
   dfx deploy
   ```

## Manual Validation

### Basic Functionality Check

```bash
# Test hello function
dfx canister call main hello

# Check contract balance
dfx canister call main getContractBalance

# Get current stats
dfx canister call main getStats

# Check flood threshold
dfx canister call main getThreshold
```

### Policy Creation Test

```bash
# Buy insurance (coverage: 1000)
dfx canister call main buyInsurance '(1000)'

# Check policy
dfx canister call main getMyPolicy

# Activate policy
dfx canister call main activatePolicy

# Pay premium
dfx canister call main payPremium
```

### Payout Test

```bash
# Set flood level above threshold
dfx canister call main updateFloodData

# Set threshold lower than current level
dfx canister call main setThreshold '(500)'

# Trigger payout
dfx canister call main triggerPayout

# Check payout status
dfx canister call main getMyPolicy
```

## Performance Metrics

### Expected Response Times

- **Simple queries**: < 100ms
- **Policy operations**: < 500ms
- **Payout processing**: < 1000ms
- **Batch operations**: < 2000ms

### Resource Usage

- **Memory**: < 50MB
- **Cycles**: < 100B per operation
- **Storage**: Efficient hashmap usage

## Troubleshooting

### Test Failures

1. **Check canister logs**
   ```bash
   dfx canister call main getStats
   ```

2. **Verify network status**
   ```bash
   dfx ping
   ```

3. **Check cycles balance**
   ```bash
   dfx wallet balance
   ```

### Common Issues

| Issue | Solution |
|-------|----------|
| Low cycles | `dfx wallet topup` |
| Network errors | Check network config |
| Build failures | Verify Motoko syntax |
| Test timeouts | Increase timeout values |

## Next Steps After Testing

### 1. Local Success
- All tests pass
- Functionality verified
- Ready for testnet

### 2. Testnet Deployment
- Deploy using script
- Run tests on testnet
- Validate network behavior

### 3. Production Readiness
- Performance validation
- Security audit
- Mainnet deployment

## Support

### Debug Commands
```bash
# Canister status
dfx canister status main

# View logs
dfx canister call main getStats

# Network info
dfx ping
```

### Documentation
- `ICP_IMPLEMENTATION_README.md` - Complete guide
- `activity.md` - Change history
- `scripts/` - Automation scripts

### Community
- ICP Forum: https://forum.dfinity.org/
- Discord: https://discord.gg/icp
- GitHub: https://github.com/dfinity

---

**Note**: Always run tests in a clean environment and verify all functionality before proceeding to production deployment.