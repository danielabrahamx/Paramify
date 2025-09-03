# Test backend API endpoints
Write-Host "🧪 Testing backend API endpoints..." -ForegroundColor Yellow

$baseUrl = "http://localhost:3002"

# Test health endpoint
Write-Host "`n🔍 Testing health endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method Get -TimeoutSec 10
    Write-Host "✅ Health check passed: $($response.status)" -ForegroundColor Green
    Write-Host "   Message: $($response.message)" -ForegroundColor White
    Write-Host "   Timestamp: $($response.timestamp)" -ForegroundColor White
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test status endpoint
Write-Host "`n🔍 Testing status endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/status" -Method Get -TimeoutSec 10
    Write-Host "✅ Status check passed" -ForegroundColor Green
    Write-Host "   Service: $($response.service)" -ForegroundColor White
    Write-Host "   Last Update: $($response.lastUpdate)" -ForegroundColor White
    Write-Host "   Data Source: $($response.dataSource)" -ForegroundColor White
} catch {
    Write-Host "❌ Status check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test flood data endpoint
Write-Host "`n🔍 Testing flood data endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/flood-data" -Method Get -TimeoutSec 10
    Write-Host "✅ Flood data check passed" -ForegroundColor Green
    Write-Host "   Status: $($response.status)" -ForegroundColor White
    Write-Host "   Value: $($response.value)" -ForegroundColor White
    Write-Host "   Source: $($response.source)" -ForegroundColor White
} catch {
    Write-Host "❌ Flood data check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test policies endpoint
Write-Host "`n🔍 Testing policies endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/policies" -Method Get -TimeoutSec 10
    Write-Host "✅ Policies check passed" -ForegroundColor Green
    Write-Host "   Success: $($response.success)" -ForegroundColor White
    Write-Host "   Policy count: $($response.policies.Count)" -ForegroundColor White
} catch {
    Write-Host "❌ Policies check failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test ICP stats endpoint
Write-Host "`n🔍 Testing ICP stats endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/policies/stats/icp" -Method Get -TimeoutSec 10
    Write-Host "✅ ICP stats check passed" -ForegroundColor Green
    Write-Host "   Success: $($response.success)" -ForegroundColor White
    Write-Host "   Status: $($response.data.status)" -ForegroundColor White
    Write-Host "   Source: $($response.data.source)" -ForegroundColor White
    Write-Host "   Total Policies: $($response.data.totalPolicies)" -ForegroundColor White
} catch {
    Write-Host "❌ ICP stats check failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎯 Backend API testing complete!" -ForegroundColor Green
Write-Host "If any tests failed, make sure the backend server is running:" -ForegroundColor Yellow
Write-Host "   cd backend && npm start" -ForegroundColor White
