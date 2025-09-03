# Agent Systems Instructions for Paramify ICP Codebase

## Overview
Paramify is a decentralized flood insurance platform built on the Internet Computer Protocol (ICP). The system uses real-time USGS water level data to automatically trigger insurance payouts when flood thresholds are exceeded. The architecture consists of ICP canisters (Rust/Motoko), a React frontend with Internet Identity authentication, and direct HTTP outcalls to external APIs.

## Project Architecture

<system_components>
<icp_canisters directory="/src/canisters/">
<canister name="insurance" type="main">Main insurance canister managing policies and payouts</canister>
<canister name="oracle" type="data">Oracle canister fetching USGS flood data via HTTP outcalls</canister>
<canister name="payments" type="financial">Payments canister handling ICRC-1 token transfers</canister>
</icp_canisters>

<standalone_canister directory="/icp-canister/">
<canister name="paramify_insurance" type="standalone">Complete insurance system in single canister</canister>
<implementation>Rust with stable memory for persistence</implementation>
<features>
- Policy creation and management
- Flood threshold monitoring
- Automated payout processing
- Admin and oracle role management
</features>
</standalone_canister>

<frontend_application directory="/frontend/src/">
<dashboard name="InsuracleDashboard.tsx" type="customer">Customer interface with Internet Identity authentication</dashboard>
<dashboard name="InsuracleDashboardAdmin.tsx" type="admin">Admin interface for system management</dashboard>
<library name="declarations/" type="generated">Auto-generated canister interfaces from Candid</library>
<library name="lib/agent.ts" type="client">ICP agent configuration and authentication</library>
</frontend_application>
</system_components>

## Critical Canister ID Management

<canister_id_warning>
⚠️ IMPORTANT: Canister IDs are generated on first deployment and persist across restarts!
</canister_id_warning>

<canister_id_management>
Canister IDs are automatically generated and stored in `.dfx/local/canister_ids.json`. The frontend automatically uses these IDs via generated declarations.

<deployment_workflow>
<step number="1">Start ICP replica: `dfx start --clean --background`</step>
<step number="2">Deploy canisters: `dfx deploy`</step>
<step number="3">Generate frontend declarations: `dfx generate`</step>
<step number="4">Start frontend: `cd frontend && npm run dev`</step>
</deployment_workflow>

<critical_note>
⚠️ Canister IDs persist in .dfx/local/ - only change when using --clean flag or switching networks
</critical_note>

## User Roles & Authentication

<authentication_system>
<internet_identity>
<purpose>Primary authentication method for users</purpose>
<features>
<feature>Seamless login without private key management</feature>
<feature>Hardware security key support</feature>
<feature>Multi-device authentication</feature>
<feature>Principal-based identity system</feature>
</features>
</internet_identity>

<plug_wallet>
<purpose>Alternative wallet for advanced users</purpose>
<features>
<feature>Browser extension wallet</feature>
<feature>Direct canister interaction</feature>
<feature>Token management</feature>
</features>
</plug_wallet>
</authentication_system>

<dashboard_specifications>
<customer_dashboard file="InsuracleDashboard.tsx">
<purpose>End-user interface for flood insurance</purpose>
<features>
<feature>Buy insurance policies using Internet Identity</feature>
<feature>View real-time flood levels from USGS API</feature>
<feature>Claim payouts when flood threshold exceeded</feature>
<feature>Monitor policy status and coverage</feature>
</features>
<target_users>Insurance customers with Internet Identity</target_users>
<key_functions>
<function>purchasePolicy()</function>
<function>claimPayout()</function>
<function>checkEligibility()</function>
</key_functions>
</customer_dashboard>

<admin_dashboard file="InsuracleDashboardAdmin.tsx">
<purpose>System administration interface</purpose>
<features>
<feature>Manage flood thresholds dynamically</feature>
<feature>Monitor system health and statistics</feature>
<feature>View all policies and user data</feature>
<feature>Update oracle data sources</feature>
</features>
<access_control>
<admin_principal>Principal-based admin role</admin_principal>
<restrictions>Only admin principal can access management functions</restrictions>
</access_control>
<key_functions>
<function>updateThreshold()</function>
<function>getSystemStatus()</function>
<function>manageOracle()</function>
</key_functions>
</admin_dashboard>
</dashboard_specifications>

## Data Flow & ICP Integration

<icp_data_flow>
<data_source order="1" name="USGS API">Real-time water level data in feet via HTTP outcalls</data_source>
<processing order="2" name="Oracle Canister">Fetches and processes USGS data directly</processing>
<storage order="3" name="Insurance Canister">Stores policies and flood data in stable memory</storage>
<display order="4" name="Frontend">Displays data via generated canister interfaces</display>
</icp_data_flow>

<unit_conversions>
<token_units>
<factor>100,000,000</factor>
<conversion>ICP Tokens = Amount × 100,000,000 (8 decimals)</conversion>
<examples>
<example input="1.0 ICP" output="100,000,000 e8s"/>
<example input="0.1 ICP" output="10,000,000 e8s"/>
</examples>
</token_units>

<flood_units>
<factor>1,000,000,000,000</factor>
<conversion>Flood Units = Feet × 1,000,000,000,000 (12 decimals)</conversion>
<examples>
<example input="3.0 ft" output="3,000,000,000,000 units"/>
<example input="4.24 ft" output="4,240,000,000,000 units"/>
</examples>
</flood_units>
</unit_conversions>

## Network Configuration

<network_environments>
<local_development name="ICP Local">
<replica_url>http://localhost:4943</replica_url>
<internet_identity>http://localhost:4943?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai</internet_identity>
<admin_principal>Auto-generated on first deployment</admin_principal>
<cycles>Unlimited on local replica</cycles>
</local_development>

<icp_testnet>
<replica_url>https://ic0.app</replica_url>
<internet_identity>https://identity.ic0.app</internet_identity>
<cycles>Requires cycles for deployment and operations</cycles>
<note>Testnet environment for development and testing</note>
</icp_testnet>

<icp_mainnet>
<replica_url>https://ic0.app</replica_url>
<internet_identity>https://identity.ic0.app</internet_identity>
<cycles>Production cycles required</cycles>
<note>Production environment for live deployment</note>
</icp_mainnet>
</network_environments>

## Common Development Patterns

### When Editing UI Components
- Always maintain consistency between customer and admin dashboards
- Use Internet Identity authentication consistently
- Ensure responsive design and proper error handling
- Handle Principal IDs instead of Ethereum addresses

### When Updating Canisters
1. Make changes to canister source code (Rust/Motoko)
2. Update Candid interfaces if needed
3. Redeploy with `dfx deploy`
4. Generate new frontend declarations with `dfx generate`
5. Test on both dashboards

### When Modifying Canister Interfaces
- Update Candid interface definitions
- Regenerate frontend declarations
- Update TypeScript types in frontend
- Test canister calls from frontend

## Testing Workflow

<complete_system_test>
<test_sequence>
<step number="1">Start ICP replica: `dfx start --clean --background`</step>
<step number="2">Deploy canisters: `dfx deploy`</step>
<step number="3">Generate declarations: `dfx generate`</step>
<step number="4">Start frontend: `cd frontend && npm run dev`</step>
<step number="5">Test customer flow: Connect with Internet Identity, buy insurance, claim payout</step>
<step number="6">Test admin flow: Update threshold, monitor system, manage policies</step>
</test_sequence>
</complete_system_test>

<canister_testing>
<test_commands>
- Test insurance canister: `dfx canister call insurance get_system_status`
- Test oracle canister: `dfx canister call oracle get_latest_data`
- Test payments canister: `dfx canister call payments get_balance`
- Create policy: `dfx canister call insurance create_policy '(1000000000, 10000000000)'`
- Set flood level: `dfx canister call oracle set_flood_level '(1600000000000)'`
</test_commands>
</canister_testing>

<threshold_testing>
<test_parameters>
- Set threshold below current USGS level to trigger payout conditions
- Test with various threshold values (common range: 3-15 feet)
- Verify immediate UI updates after threshold changes
- Test HTTP outcalls to USGS API
</test_parameters>
</threshold_testing>

## Environment Management

### Required Services
- **ICP Replica**: Must be running on port 4943
- **Internet Identity**: Available at localhost:4943 (local) or ic0.app (mainnet)
- **Frontend Dev Server**: Typically port 5173 (Vite)

### Service Dependencies
- Frontend depends on canister declarations for type safety
- Canisters communicate via ICP's native messaging
- HTTP outcalls provide external API integration
- All services can gracefully handle temporary disconnections

## Security Considerations

### Access Control
- Principal-based authentication using Internet Identity
- Role-based permissions (admin, oracle, user)
- Canister-level access control for sensitive functions
- Input validation for all numeric inputs (thresholds, amounts)

### Error Handling
- Always handle canister connectivity issues
- Provide user-friendly error messages for ICP-specific errors
- Implement retry logic for HTTP outcalls
- Graceful degradation when services are unavailable
- Handle cycles exhaustion scenarios

## Common Issues & Solutions

<troubleshooting_guide>
<critical_issues>
<issue priority="high" category="deployment">
<title>DFX Replica Connection Failed</title>
<problem>DFX fails to start or connect to replica</problem>
<cause>Port conflicts, corrupted state, or previous instances still running</cause>
<symptoms>
- Error: `Address already in use (os error 98)`
- Error: `Connection refused (os error 111)`
- DFX commands fail with connection errors
</symptoms>
<solution_windows>
<step number="1">Kill all DFX processes: `taskkill /F /IM dfx.exe`</step>
<step number="2">Check port usage: `netstat -ano | findstr :4943`</step>
<step number="3">Kill conflicting processes: `taskkill /PID <PID_NUMBER> /F`</step>
<step number="4">Clear DFX state: `rm -rf ~/.local/share/dfx/network/local`</step>
<step number="5">Restart DFX: `dfx start --clean --background`</step>
</solution_windows>
<solution_linux_macos>
<step number="1">Kill all DFX processes: `pkill -f dfx`</step>
<step number="2">Check port usage: `lsof -i :4943`</step>
<step number="3">Kill conflicting processes: `kill -9 <PID_NUMBER>`</step>
<step number="4">Clear DFX state: `rm -rf ~/.local/share/dfx/network/local`</step>
<step number="5">Restart DFX: `dfx start --clean --background`</step>
</solution_linux_macos>
<prevention>Always use `dfx stop` before starting new instances. Use `--clean` flag when having issues.</prevention>
</issue>

<issue priority="medium" category="deployment">
<title>Frontend Running on Wrong Port</title>
<problem>Frontend starts on port 5173 instead of configured port 8080, or uses alternative ports like 8081</problem>
<cause>Previous frontend instances running or port conflicts causing Vite to choose alternative ports</cause>
<symptoms>
- Frontend accessible on port 5173 instead of 8080
- Vite shows "Local: http://localhost:5173/" instead of 8080
- Alternative ports used (8081, 8082, etc.)
</symptoms>
<solution_windows>
<step number="1">Check what's using port 8080: `netstat -ano | findstr :8080`</step>
<step number="2">Kill any conflicting processes: `taskkill /PID <PID_NUMBER> /F`</step>
<step number="3">Check for other Vite processes: `netstat -ano | findstr :5173`</step>
<step number="4">Kill Vite processes if needed: `taskkill /PID <PID_NUMBER> /F`</step>
<step number="5">Restart frontend: `cd frontend; npm run dev`</step>
<step number="6">Verify running on port 8080: http://localhost:8080/</step>
</solution_windows>
<solution_linux_macos>
<step number="1">Check port usage: `lsof -i :8080`</step>
<step number="2">Kill conflicting processes: `kill -9 <PID_NUMBER>`</step>
<step number="3">Check Vite processes: `lsof -i :5173`</step>
<step number="4">Kill if needed: `kill -9 <PID_NUMBER>`</step>
<step number="5">Restart frontend: `cd frontend && npm run dev`</step>
</solution_linux_macos>
<prevention>Always ensure port 8080 is free before starting frontend. Check vite.config.ts has correct port configuration.</prevention>
</issue>

<issue priority="high" category="deployment">
<title>Canister Deployment Fails</title>
<problem>Canisters fail to deploy or show errors during deployment</problem>
<cause>Insufficient cycles, build errors, or replica connectivity issues</cause>
<symptoms>
- Error: `Insufficient cycles`
- Error: `Build failed`
- Error: `Canister not found`
- Deployment hangs or times out
</symptoms>
<solution>
<step number="1">Check replica status: `dfx ping`</step>
<step number="2">Check cycles balance: `dfx wallet balance`</step>
<step number="3">Clear build cache: `rm -rf .dfx`</step>
<step number="4">Rebuild canisters: `dfx build`</step>
<step number="5">Deploy with cycles: `dfx deploy --with-cycles 1000000000000`</step>
</solution>
<prevention>Always check replica status and cycles balance before deployment. Use `--with-cycles` flag for large deployments.</prevention>
</issue>
</critical_issues>

<standard_issues>
<issue category="connectivity">
<title>"Canister not found" errors</title>
<solution>
- Verify canisters are deployed: `dfx canister status --all`
- Check canister IDs in frontend declarations
- Regenerate declarations: `dfx generate`
- Ensure replica is running: `dfx ping`
</solution>
</issue>

<issue category="data">
<title>USGS data not updating</title>
<solution>
- Check oracle canister logs: `dfx canister logs oracle`
- Verify HTTP outcalls are working
- Test oracle manually: `dfx canister call oracle get_latest_data`
- Check USGS API connectivity
</solution>
</issue>

<issue category="authentication">
<title>Internet Identity connection issues</title>
<solution>
- Clear browser cache and cookies
- Try different Internet Identity provider
- Check if local replica is running on correct port
- Verify Internet Identity canister is deployed
</solution>
</issue>

<issue category="admin">
<title>Admin functions not working</title>
<solution>
- Confirm admin principal is set correctly
- Check canister access control
- Verify principal has admin role
- Test admin functions via dfx commands
</solution>
</issue>

<issue category="ui" date_added="2025-06-25">
<title>UI Display Reverting to Units Instead of Feet</title>
<problem>Admin dashboard flood level occasionally displays raw contract units instead of user-friendly feet format</problem>
<cause>Inconsistent data updates or state management between customer actions and admin dashboard</cause>
<solution>
<step number="1">Ensure both dashboards use the same conversion formula: `(floodLevel / 100000000000).toFixed(2) ft`</step>
<step number="2">Verify state updates are consistent across components</step>
<step number="3">Check that USGS data updates don't override the display format</step>
</solution>
<prevention>Always use the feet display format as primary with units as secondary reference</prevention>
</issue>

<issue category="compatibility" date_added="2025-06-25">
<title>Shell Command Compatibility Issues</title>
<problem>AI agents using wrong shell syntax causing command failures (e.g., using `&&` in PowerShell)</problem>
<cause>Not detecting or asking about user's operating system and shell environment</cause>
<solution>
<step number="1">Always check environment info or ask user about their OS/shell</step>
<step number="2">Use PowerShell syntax for Windows: `cd backend; npm start`</step>
<step number="3">Use Bash syntax for Linux/macOS: `cd backend && npm start`</step>
<step number="4">Provide OS-specific command examples in documentation</step>
</solution>
<prevention>Include OS detection as standard practice for all AI agents</prevention>
</issue>
</standard_issues>
</troubleshooting_guide>

## File Structure Reference

```
/src/canisters/
├── insurance/                # Insurance canister (Motoko)
│   ├── main.mo              # Main insurance logic
│   └── insurance.test.mo    # Unit tests
├── oracle/                  # Oracle canister (Rust)
│   ├── src/lib.rs          # Oracle implementation
│   └── Cargo.toml          # Rust dependencies
└── payments/                # Payments canister (Motoko)
    ├── main.mo              # Payment processing
    └── payments.test.mo     # Unit tests

/icp-canister/               # Standalone insurance canister
├── src/lib.rs              # Complete Rust implementation
├── Cargo.toml              # Rust dependencies
└── dfx.json                # Deployment configuration

/frontend/src/
├── InsuracleDashboard.tsx         # Customer interface
├── InsuracleDashboardAdmin.tsx    # Admin interface
├── declarations/                  # Generated canister interfaces
└── lib/
    └── agent.ts            # ICP agent configuration

/interfaces/                 # Candid interface definitions
├── insurance.did           # Insurance canister interface
├── oracle.did              # Oracle canister interface
└── payments.did            # Payments canister interface

Documentation/
├── docs/setup.md           # Setup instructions
├── docs/frontend-integration.md  # Frontend migration guide
└── AGENT_SYSTEMS_INSTRUCTIONS.md  # This file
```

## Key Canister Methods

### Insurance Canister
- `get_system_status()` - Complete system status
- `create_policy(coverage_amount, premium_amount)` - Create new policy
- `get_policy(principal)` - Get user's policy
- `claim_payout()` - Claim payout if eligible
- `check_payout_eligibility(principal)` - Check if user can claim
- `get_all_policies()` - Get all policies (admin only)
- `update_threshold(threshold)` - Update flood threshold (admin only)

### Oracle Canister
- `get_latest_data()` - Get current flood data
- `set_flood_level(level)` - Set flood level (oracle only)
- `get_threshold()` - Get current threshold
- `update_from_usgs()` - Fetch data from USGS API

### Payments Canister
- `get_balance(principal)` - Get user's token balance
- `transfer(from, to, amount)` - Transfer tokens
- `get_total_supply()` - Get total token supply

## Development Best Practices

### When Making Changes
1. Always test on both customer and admin dashboards
2. Verify canister calls work correctly
3. Update relevant documentation
4. Test with both connected and disconnected states
5. Ensure graceful error handling for ICP-specific errors

### Code Consistency
- Use consistent Principal ID handling
- Maintain consistent error message formatting
- Follow the established TypeScript patterns for ICP
- Keep UI components visually consistent
- Use proper BigInt handling for token amounts

### Git Workflow
- Commit canister changes separately from frontend changes
- Include deployment instructions in commit messages
- Update relevant documentation files with each change
- Test canister deployments before committing

---

## Quick Reference Commands

### Windows (PowerShell)
```powershell
# Enter WSL environment
wsl

# Start ICP replica
dfx start --clean --background

# Deploy canisters
dfx deploy

# Generate frontend declarations
dfx generate

# Start frontend
cd frontend; npm run dev

# Check canister status
dfx canister status --all

# Test canister calls
dfx canister call insurance get_system_status
```

### Linux/macOS (Bash)
```bash
# Start ICP replica
dfx start --clean --background

# Deploy canisters
dfx deploy

# Generate frontend declarations
dfx generate

# Start frontend
cd frontend && npm run dev

# Check canister status
dfx canister status --all

# Test canister calls
dfx canister call insurance get_system_status
```

---

## Instructions for AI Agents: Maintaining This Document

<agent_instructions>
<critical_requirements>
⚠️ IMPORTANT: Any AI agent working on this ICP codebase MUST update this file when they discover:

<mandatory_updates>
1. New ICP-specific bugs or issues not covered in the troubleshooting section
2. Better canister development patterns or more efficient workflows  
3. Missing critical ICP information that would help future agents
4. Changes to the canister architecture or new features added
5. Updated ICP dependencies or environment requirements
6. New testing procedures or deployment steps for ICP
7. Security considerations specific to ICP not previously documented
8. Internet Identity or authentication issues
9. Canister upgrade procedures or stable memory management
10. HTTP outcalls or external API integration patterns
</mandatory_updates>
</critical_requirements>

<documentation_workflow>
<section_mapping>
When you discover something new, add it to the appropriate section:
- ICP Bugs/Issues → Add to "Common Issues & Solutions"
- New canister workflows → Add to "Development Best Practices" or "Testing Workflow"
- Architecture changes → Update "Project Architecture" section
- New canister methods → Update "Key Canister Methods"
- Environment changes → Update "Environment Management" or "Network Configuration"
- Authentication issues → Add to "User Roles & Authentication"
- Canister deployment issues → Add to "Critical Canister ID Management"
</section_mapping>

<standards>
- Use clear, actionable language
- Include code examples where helpful
- Reference specific file paths and line numbers when relevant
- Add timestamps for significant architectural changes
- Maintain the existing formatting and structure
</standards>
</documentation_workflow>

<os_shell_compatibility>
<critical_note>
AI agents MUST detect or ask about the user's operating system and use appropriate commands
</critical_note>

<windows_powershell>
- Use `;` instead of `&&` for command chaining: `cd backend; npm start`
- Use PowerShell-compatible commands and syntax
- File paths use backslashes: `c:\Users\danie\Paramify-1\`
</windows_powershell>

<linux_macos_bash>
- Use `&&` for command chaining: `cd backend && npm start`
- Use Unix-style commands and syntax
- File paths use forward slashes: `/home/user/Paramify-1/`
</linux_macos_bash>

<best_practice>
Always ask the user about their OS/shell at the beginning of a session, or detect from environment info when available.
</best_practice>
</os_shell_compatibility>

<update_pattern_template>
When adding new issues, use this XML-structured format:

```markdown
### [New Issue Title] (Added: 2025-06-25)
**Problem**: Brief description of the issue
**Cause**: Why it happens
**Solution**: Step-by-step fix
**Prevention**: How to avoid in the future
```
</update_pattern_template>

<living_document_principle>
This documentation is a living document that should evolve with the codebase. Your insights help future agents work more efficiently and avoid repeating the same discoveries.
</living_document_principle>
</agent_instructions>

---

This file should be consulted before making any significant changes to the Paramify system. Keep it updated as the project evolves and your discoveries will benefit all future AI agents working on this project.
