# Paramify ICP Canister

This is the Internet Computer Protocol (ICP) implementation of the Paramify flood insurance system, migrated from the Ethereum NFT-based version.

## Overview

The ICP canister manages insurance policies as regular data entries instead of NFTs. Each policy is stored in the canister's stable memory and can be queried and updated through the canister's public interface.

## Architecture

### Data Structures

- **Policy**: Contains all insurance policy information
  - `policy_id`: Unique identifier (auto-incrementing)
  - `policyholder`: Principal ID of the policy owner
  - `premium`: Amount paid for the insurance (in ICP units)
  - `coverage`: Maximum payout amount (in ICP units)
  - `purchase_time`: Unix timestamp of purchase
  - `active`: Whether the policy is currently active
  - `paid_out`: Whether a payout has been issued

### Key Functions

#### Policy Management
- `create_policy(premium, coverage)`: Create a new insurance policy
- `get_policy(policy_id)`: Query a specific policy by ID
- `get_policy_by_holder(principal)`: Query policy by policyholder
- `trigger_payout()`: Trigger a payout for the caller's policy
- `is_payout_eligible(principal)`: Check if a policy is eligible for payout

#### Admin Functions
- `get_all_policies()`: Get all policies (admin only)
- `get_policy_stats()`: Get statistics (total, active, paid out)
- `transfer_admin(new_admin)`: Transfer admin role
- `set_flood_threshold(threshold)`: Set the flood level threshold for payouts

#### Oracle Functions
- `set_flood_level(level)`: Update the current flood level
- `get_flood_level()`: Query current flood level
- `add_oracle_updater(principal)`: Add an authorized oracle updater
- `remove_oracle_updater(principal)`: Remove an oracle updater

## Deployment Instructions

### Prerequisites

1. Install the DFINITY Canister SDK (dfx):
   ```bash
   sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"
   ```

2. Install Rust (if not already installed):
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

3. Add WebAssembly target:
   ```bash
   rustup target add wasm32-unknown-unknown
   ```

### Local Deployment

1. Navigate to the canister directory:
   ```bash
   cd icp-canister
   ```

2. Start a local Internet Computer replica:
   ```bash
   dfx start --clean
   ```

3. In another terminal, deploy the canister:
   ```bash
   dfx deploy
   ```

4. Note the canister ID displayed after deployment.

### Mainnet Deployment

1. Create a new identity (if needed):
   ```bash
   dfx identity new paramify_admin
   dfx identity use paramify_admin
   ```

2. Get ICP tokens for deployment (cycles):
   ```bash
   dfx identity get-principal
   # Fund this principal with ICP tokens
   ```

3. Deploy to mainnet:
   ```bash
   dfx deploy --network ic
   ```

## Testing the Canister

### Create a Policy
```bash
dfx canister call paramify_insurance create_policy '(1000000000, 10000000000)'
```

### Check Policy Stats
```bash
dfx canister call paramify_insurance get_policy_stats
```

### Set Flood Level (as oracle)
```bash
dfx canister call paramify_insurance set_flood_level '(1300000000000)'
```

### Trigger Payout
```bash
dfx canister call paramify_insurance trigger_payout
```

## Integration with Frontend

To integrate with the React frontend, you'll need to:

1. Install ICP agent library:
   ```bash
   npm install @dfinity/agent @dfinity/principal
   ```

2. Replace ethers.js calls with ICP agent calls (see frontend adaptation guide).

## Integration with Backend Oracle

The Node.js backend needs to be updated to call `set_flood_level` on the ICP canister instead of updating the Ethereum oracle contract.

## Security Considerations

- The canister implements role-based access control (admin and oracle roles)
- Only one policy per principal is allowed to be active at a time
- Flood threshold validation prevents setting unreasonable values
- All state is persisted in stable memory for upgrade safety

## Differences from Ethereum Version

1. **No NFTs**: Policies are stored as regular data, not tokens
2. **Principal-based identity**: Uses ICP Principals instead of Ethereum addresses
3. **Native stable storage**: Automatic persistence without external storage
4. **Cycles instead of gas**: Computation is paid with cycles
5. **No on-chain SVG generation**: Frontend handles all visual representation

## Further Development

For production use, consider:
- Implementing actual ICP token transfers for premiums and payouts
- Adding more sophisticated oracle mechanisms
- Implementing policy expiration logic
- Adding more detailed policy parameters
- Creating a proper frontend canister for the UI

