# Frontend Adaptation Guide for ICP Integration

This guide explains how to modify the React frontend to interact with the ICP canister instead of Ethereum smart contracts.

## 1. Install Required Dependencies

```bash
npm install @dfinity/agent @dfinity/principal @dfinity/auth-client
```

## 2. Create ICP Agent Configuration

Create a new file `frontend/src/lib/icpAgent.ts`:

```typescript
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { AuthClient } from '@dfinity/auth-client';

// Import the canister interface (generated from .did file)
import { idlFactory } from './paramify_insurance.did.js';

// Canister ID (replace with your deployed canister ID)
const CANISTER_ID = process.env.REACT_APP_CANISTER_ID || 'your-canister-id-here';

// Network configuration
const network = process.env.REACT_APP_NETWORK || 'local';
const host = network === 'local' ? 'http://localhost:8080' : 'https://ic0.app';

// Create agent and actor
export const createActor = async () => {
  const agent = new HttpAgent({ host });
  
  // For local development, disable certificate verification
  if (network === 'local') {
    await agent.fetchRootKey();
  }
  
  return Actor.createActor(idlFactory, {
    agent,
    canisterId: CANISTER_ID,
  });
};

// Authentication helper
export const authenticate = async () => {
  const authClient = await AuthClient.create();
  
  if (await authClient.isAuthenticated()) {
    return authClient.getIdentity();
  }
  
  return new Promise((resolve, reject) => {
    authClient.login({
      identityProvider: network === 'local' 
        ? `http://localhost:8080?canisterId=${CANISTER_ID}`
        : 'https://identity.ic0.app',
      onSuccess: () => resolve(authClient.getIdentity()),
      onError: reject,
    });
  });
};
```

## 3. Update Contract Interface

Replace `frontend/src/lib/contract.ts` with:

```typescript
import { createActor, authenticate } from './icpAgent';
import { Principal } from '@dfinity/principal';

// Type definitions matching the canister
export interface Policy {
  policy_id: bigint;
  policyholder: Principal;
  premium: bigint;
  coverage: bigint;
  purchase_time: bigint;
  active: boolean;
  paid_out: boolean;
}

// Contract interface wrapper
export class ParamifyContract {
  private actor: any;
  
  constructor(actor: any) {
    this.actor = actor;
  }
  
  // Buy insurance (create policy)
  async buyInsurance(coverage: bigint, premium: bigint): Promise<bigint> {
    const result = await this.actor.create_policy(premium, coverage);
    if ('Ok' in result) {
      return result.Ok;
    }
    throw new Error(result.Err);
  }
  
  // Get policy for current user
  async getMyPolicy(): Promise<Policy | null> {
    const identity = await authenticate();
    const principal = identity.getPrincipal();
    const policy = await this.actor.get_policy_by_holder(principal);
    return policy.length > 0 ? policy[0] : null;
  }
  
  // Trigger payout
  async triggerPayout(): Promise<bigint> {
    const result = await this.actor.trigger_payout();
    if ('Ok' in result) {
      return result.Ok;
    }
    throw new Error(result.Err);
  }
  
  // Check payout eligibility
  async isPayoutEligible(principal: Principal): Promise<boolean> {
    return await this.actor.is_payout_eligible(principal);
  }
  
  // Get policy stats
  async getPolicyStats(): Promise<{ total: number; active: number; paidOut: number }> {
    const [total, active, paidOut] = await this.actor.get_policy_stats();
    return {
      total: Number(total),
      active: Number(active),
      paidOut: Number(paidOut),
    };
  }
  
  // Get flood level
  async getFloodLevel(): Promise<number> {
    const level = await this.actor.get_flood_level();
    return Number(level);
  }
  
  // Get threshold
  async getThreshold(): Promise<number> {
    const threshold = await this.actor.get_flood_threshold();
    return Number(threshold);
  }
}

// Export singleton instance
let contractInstance: ParamifyContract | null = null;

export const getContract = async (): Promise<ParamifyContract> => {
  if (!contractInstance) {
    const actor = await createActor();
    contractInstance = new ParamifyContract(actor);
  }
  return contractInstance;
};
```

## 4. Update React Components

### Example: Update InsuracleDashboard.tsx

Replace Web3 hooks with ICP integration:

```typescript
import React, { useEffect, useState } from 'react';
import { getContract, Policy } from '../lib/contract';
import { authenticate } from '../lib/icpAgent';
import { Principal } from '@dfinity/principal';

export function InsuracleDashboard() {
  const [loading, setLoading] = useState(true);
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [floodLevel, setFloodLevel] = useState<number>(0);
  const [threshold, setThreshold] = useState<number>(0);
  
  // Initialize ICP connection
  useEffect(() => {
    const init = async () => {
      try {
        const identity = await authenticate();
        setPrincipal(identity.getPrincipal());
        await loadData();
      } catch (error) {
        console.error('Failed to authenticate:', error);
      }
      setLoading(false);
    };
    init();
  }, []);
  
  const loadData = async () => {
    try {
      const contract = await getContract();
      
      // Load policy data
      const myPolicy = await contract.getMyPolicy();
      setPolicy(myPolicy);
      
      // Load flood data
      const level = await contract.getFloodLevel();
      setFloodLevel(level);
      
      const thresh = await contract.getThreshold();
      setThreshold(thresh);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };
  
  const handleBuyInsurance = async (coverage: string) => {
    try {
      const contract = await getContract();
      const coverageAmount = BigInt(coverage);
      const premium = coverageAmount / 10n; // 10% premium
      
      const policyId = await contract.buyInsurance(coverageAmount, premium);
      console.log('Policy created with ID:', policyId);
      
      await loadData(); // Reload data
    } catch (error) {
      console.error('Failed to buy insurance:', error);
    }
  };
  
  const handleTriggerPayout = async () => {
    try {
      const contract = await getContract();
      const payoutAmount = await contract.triggerPayout();
      console.log('Payout triggered:', payoutAmount);
      
      await loadData(); // Reload data
    } catch (error) {
      console.error('Failed to trigger payout:', error);
    }
  };
  
  // Rest of your component logic...
}
```

## 5. Key Changes Summary

### From Ethereum to ICP:

1. **Addresses → Principals**: Replace Ethereum addresses with ICP Principal IDs
2. **Wei → ICP Units**: Update value calculations (no need for 1e18 conversion)
3. **MetaMask → Internet Identity**: Use ICP's Internet Identity for authentication
4. **Events → Polling**: ICP doesn't have events; implement polling for updates
5. **Gas Fees → Cycles**: Users don't pay for transactions directly

### Removed Features:

1. **NFT Metadata**: No tokenURI or on-chain SVG generation
2. **Token Transfers**: Policies are non-transferable by design
3. **Contract Balance**: Handled differently in ICP

### Component Updates Needed:

1. **App.tsx**: Update provider initialization
2. **InsuracleDashboard.tsx**: Replace Web3 calls with ICP calls
3. **InsuracleDashboardAdmin.tsx**: Update admin functions
4. **Remove**: Web3Modal, ethers.js imports

## 6. Environment Variables

Create `.env` file:

```
REACT_APP_CANISTER_ID=your-canister-id
REACT_APP_NETWORK=local
```

## 7. Handling Authentication

ICP uses Internet Identity instead of MetaMask:

```typescript
const ConnectButton = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const handleConnect = async () => {
    try {
      await authenticate();
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };
  
  return (
    <button onClick={handleConnect}>
      {isAuthenticated ? 'Connected' : 'Connect with Internet Identity'}
    </button>
  );
};
```

## 8. Policy Display Without NFTs

Since there are no NFTs, create a simple policy display component:

```typescript
const PolicyCard = ({ policy }: { policy: Policy }) => {
  return (
    <div className="policy-card">
      <h3>Policy #{policy.policy_id.toString()}</h3>
      <p>Status: {policy.active ? 'Active' : policy.paid_out ? 'Paid Out' : 'Inactive'}</p>
      <p>Coverage: {policy.coverage.toString()} ICP</p>
      <p>Premium: {policy.premium.toString()} ICP</p>
      <p>Purchase Date: {new Date(Number(policy.purchase_time) * 1000).toLocaleDateString()}</p>
    </div>
  );
};
```

## 9. Testing Locally

1. Start local ICP replica:
   ```bash
   dfx start --clean
   ```

2. Deploy canister:
   ```bash
   cd icp-canister && dfx deploy
   ```

3. Update frontend with canister ID
4. Start React app:
   ```bash
   npm start
   ```

## 10. Production Deployment

For mainnet deployment:
1. Deploy canister to IC mainnet
2. Update REACT_APP_CANISTER_ID
3. Set REACT_APP_NETWORK=ic
4. Build and deploy frontend to IC or traditional hosting

