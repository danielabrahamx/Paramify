# Start ICP canister for testing
Write-Host "🚀 Starting ICP canister..." -ForegroundColor Yellow

# Check if WSL is available
try {
    $wslCheck = wsl --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ WSL detected, starting ICP canister..." -ForegroundColor Green
        
        # Start ICP canister in WSL
        Write-Host "📁 Starting dfx and canister..." -ForegroundColor Cyan
        wsl bash -c "cd /mnt/c/Users/danie/Paramify-5/icp-canister && dfx start --background"
        
        Write-Host "⏳ Waiting for canister to start..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
        
        # Deploy the canister
        Write-Host "🔧 Deploying canister..." -ForegroundColor Cyan
        wsl bash -c "cd /mnt/c/Users/danie/Paramify-5/icp-canister && dfx deploy"
        
        Write-Host "✅ ICP canister should now be running!" -ForegroundColor Green
        Write-Host "🌐 Canister URL: http://127.0.0.1:8080" -ForegroundColor Cyan
        Write-Host "💡 Refresh your frontend to see ICP stats update" -ForegroundColor Yellow
        
    } else {
        Write-Host "❌ WSL not available" -ForegroundColor Red
        Write-Host "💡 Install WSL to run ICP canister locally" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Error starting ICP canister: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "💡 Make sure WSL is installed and dfx is available" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📚 ICP Canister Documentation:" -ForegroundColor Cyan
Write-Host "   - Location: icp-canister/README.md" -ForegroundColor White
Write-Host "   - Quick Start: icp-canister/QUICK_START.md" -ForegroundColor White
Write-Host ""
Write-Host "🔍 To check if canister is running:" -ForegroundColor Cyan
Write-Host "   curl http://127.0.0.1:8080/?canisterId=u6s2n-gx777-77774-qaaba-cai" -ForegroundColor White

