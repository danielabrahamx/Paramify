# Activity Log

This file logs every change made by the assistant to improve traceability.

## 2025-08-20

- Added missing ICP canister APIs in `src/main.mo` to match frontend expectations:
  - Added `getThreshold`, `getThresholdInFeet`, `setThreshold`.
  - Added `getPolicy`, `isPayoutEligible`, `getStats`, `transferOwnership`.
- Fixed Vite environment variable usage in `frontend/src/lib/icp-integration.ts`:
  - Replaced `process.env.*` with `import.meta.env.*`.
- Added `frontend/.env.local` with local canister IDs derived from `.dfx/local/canister_ids.json`.
- Created `activity.md` file for tracking changes.
