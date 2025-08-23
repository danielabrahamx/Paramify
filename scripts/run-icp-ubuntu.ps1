# PowerShell script to run IC commands in Ubuntu terminal
# This script helps you execute the IC deployment commands

Write-Host "🚀 PARAMIFY IC CANISTER DEPLOYMENT" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

Write-Host "This script will help you deploy the IC canisters using your Ubuntu terminal." -ForegroundColor Yellow
Write-Host ""

Write-Host "📋 PREREQUISITES:" -ForegroundColor Cyan
Write-Host "   1. Make sure you are in your Ubuntu terminal (WSL)" -ForegroundColor White
Write-Host "   2. Ensure dfx is installed and working" -ForegroundColor White
Write-Host "   3. Navigate to the Paramify-1 directory" -ForegroundColor White
Write-Host ""

Write-Host "🔧 COMMANDS TO RUN IN UBUNTU TERMINAL:" -ForegroundColor Cyan
Write-Host ""

Write-Host "# 1. Navigate to project directory" -ForegroundColor White
Write-Host "cd ~/Paramify-1" -ForegroundColor Gray
Write-Host ""

Write-Host "# 2. Make deployment script executable" -ForegroundColor White
Write-Host "chmod +x scripts/deploy-icp.sh" -ForegroundColor Gray
Write-Host ""

Write-Host "# 3. Deploy all canisters" -ForegroundColor White
Write-Host "./scripts/deploy-icp.sh" -ForegroundColor Gray
Write-Host ""

Write-Host "# 4. Test the canisters" -ForegroundColor White
Write-Host "./scripts/test-icp.sh" -ForegroundColor Gray
Write-Host ""

Write-Host "🎯 ALTERNATIVE: Deploy canisters individually" -ForegroundColor Cyan
Write-Host ""

Write-Host "# Start local replica" -ForegroundColor White
Write-Host "dfx start --background" -ForegroundColor Gray
Write-Host ""

Write-Host "# Deploy core canister" -ForegroundColor White
Write-Host "dfx deploy paramify_core" -ForegroundColor Gray
Write-Host ""

Write-Host "# Deploy oracle canister" -ForegroundColor White
Write-Host "dfx deploy paramify_oracle" -ForegroundColor Gray
Write-Host ""

Write-Host "# Deploy frontend canister" -ForegroundColor White
Write-Host "dfx deploy paramify_frontend" -ForegroundColor Gray
Write-Host ""

Write-Host "# Initialize oracle" -ForegroundColor White
Write-Host "CORE_ID=$(dfx canister id paramify_core)" -ForegroundColor Gray
Write-Host "dfx canister call paramify_oracle setCoreCanisterId \"(\$CORE_ID)\"" -ForegroundColor Gray
Write-Host ""

Write-Host "🌐 After deployment, access your dApp at:" -ForegroundColor Cyan
Write-Host "   http://127.0.0.1:4943/?canisterId=<frontend-canister-id>" -ForegroundColor White
Write-Host ""

Write-Host "Press any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
