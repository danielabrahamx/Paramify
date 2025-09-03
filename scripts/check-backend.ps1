# Check if backend server is running and start it if needed
Write-Host "🔍 Checking backend server status..." -ForegroundColor Yellow

# Check if port 3002 is in use
$portCheck = netstat -ano | findstr :3002

if ($portCheck) {
    Write-Host "✅ Backend server is already running on port 3002" -ForegroundColor Green
    Write-Host "You can access it at: http://localhost:3002" -ForegroundColor Cyan
} else {
    Write-Host "❌ Backend server is not running on port 3002" -ForegroundColor Red
    Write-Host "Starting backend server..." -ForegroundColor Yellow
    
    # Navigate to backend directory and start server
    Set-Location backend
    Write-Host "📁 Changed to backend directory" -ForegroundColor Cyan
    
    # Check if node_modules exists
    if (Test-Path "node_modules") {
        Write-Host "📦 Dependencies found, starting server..." -ForegroundColor Green
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start"
        Write-Host "🚀 Backend server starting in new PowerShell window" -ForegroundColor Green
        Write-Host "⏳ Wait a few seconds for the server to fully start" -ForegroundColor Yellow
    } else {
        Write-Host "📦 Installing dependencies first..." -ForegroundColor Yellow
        npm install
        Write-Host "🚀 Starting server..." -ForegroundColor Green
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm start"
        Write-Host "⏳ Wait a few seconds for the server to fully start" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "💡 To manually start the backend server:" -ForegroundColor Cyan
Write-Host "   1. Open a new PowerShell window" -ForegroundColor White
Write-Host "   2. Navigate to the backend directory: cd backend" -ForegroundColor White
Write-Host "   3. Run: npm start" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Once running, you can test the API endpoints:" -ForegroundColor Cyan
Write-Host "   - Health check: http://localhost:3002/api/health" -ForegroundColor White
Write-Host "   - Status: http://localhost:3002/api/status" -ForegroundColor White
Write-Host "   - Flood data: http://localhost:3002/api/flood-data" -ForegroundColor White

