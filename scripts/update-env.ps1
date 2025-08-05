param(
  [string]$DeploymentJsonPath = 'pvm-deployment.json',
  [string]$EnvPath = 'frontend/.env.local'
)

$ErrorActionPreference = 'Stop'

Write-Host 'Reading deployment JSON...'
if (!(Test-Path $DeploymentJsonPath)) {
  throw "Deployment file not found: $DeploymentJsonPath"
}
$jsonRaw = Get-Content -Raw $DeploymentJsonPath
$d = $jsonRaw | ConvertFrom-Json

# Extract values
$addr  = $d.contracts.Paramify
$mock  = $d.contracts.MockV3Aggregator
$chain = $d.chainId

Write-Host ("Paramify: {0}  Mock: {1}  ChainId: {2}" -f $addr, $mock, $chain)

# Load existing env (if any)
$content = @()
if (Test-Path $EnvPath) {
  $content = Get-Content $EnvPath
}

# Remove old keys
$content = $content | Where-Object {
  $_ -notmatch '^VITE_PARAMIFY_CONTRACT_ADDRESS=' -and
  $_ -notmatch '^VITE_MOCK_AGGREGATOR_ADDRESS=' -and
  $_ -notmatch '^VITE_CHAIN_ID=' -and
  $_ -notmatch '^VITE_BACKEND_URL=' -and
  $_ -notmatch '^VITE_RPC_URL='
}

# Append new values
if ($null -ne $addr -and $addr -ne '') {
  $content += 'VITE_PARAMIFY_CONTRACT_ADDRESS=' + $addr
}
if ($null -ne $mock -and $mock -ne '') {
  $content += 'VITE_MOCK_AGGREGATOR_ADDRESS=' + $mock
}
if ($null -ne $chain -and $chain -ne '') {
  $content += 'VITE_CHAIN_ID=' + $chain
}

# Ensure sensible defaults if missing
if (-not ($content -match '^VITE_BACKEND_URL=')) {
  $content += 'VITE_BACKEND_URL=http://localhost:3001'
}
if (-not ($content -match '^VITE_RPC_URL=')) {
  # NOTE: If you are using local PolkaVM/anvil, update this to your local RPC, e.g. http://localhost:8545
  $content += 'VITE_RPC_URL=https://testnet-passet-hub-eth-rpc.polkadot.io'
}

# Save
$content | Set-Content -Path $EnvPath -NoNewline
Add-Content -Path $EnvPath -Value ''  # ensure trailing newline

Write-Host 'Updated frontend/.env.local:'
Get-Content $EnvPath
