# Network Error Resolution Guide

## Issue Summary

The console error `Failed to fetch USGS service status: AxiosError {message: 'Network Error', name: 'AxiosError', code: 'ERR_NETWORK'}` was caused by a **port mismatch** between the frontend and backend services.

## Root Cause

- **Frontend** (`usgsApi.ts`) was configured to connect to port **3001**
- **Backend** (`server.js`) was actually running on port **3002**
- This caused all API requests to fail with network errors

## What Was Fixed

### 1. Port Configuration Updates
- Updated `frontend/src/lib/usgsApi.ts` to use port 3002
- Updated `frontend/src/InsuracleDashboardAdmin.tsx` threshold endpoint to use port 3002
- Updated `README.md` to reflect correct port configuration

### 2. Enhanced Error Handling
- Added detailed error logging for different types of network failures
- Implemented retry logic for network errors (up to 3 attempts)
- Added specific error messages to help diagnose connection issues

### 3. Diagnostic Tools
- Created `scripts/check-backend.ps1` to check backend server status
- Created `scripts/test-backend.ps1` to test API endpoints
- Added helpful console messages for troubleshooting

## How to Prevent Similar Issues

### 1. Consistent Port Configuration
- Always use the same port across all configuration files
- Set port in environment variables when possible
- Document port assignments clearly

### 2. Environment Variable Usage
Consider updating `backend/server.js` to use:
```javascript
const PORT = process.env.PORT || 3002;
```

And `frontend/src/lib/usgsApi.ts` to use:
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3002/api';
```

### 3. Health Checks
- Implement health check endpoints in your backend
- Use the provided test scripts to verify connectivity
- Monitor network requests in browser DevTools

## Quick Resolution Steps

### If You Encounter Network Errors Again:

1. **Check Backend Status**
   ```powershell
   .\scripts\check-backend.ps1
   ```

2. **Test API Endpoints**
   ```powershell
   .\scripts\test-backend.ps1
   ```

3. **Verify Port Usage**
   ```powershell
   netstat -ano | findstr :3002
   ```

4. **Start Backend Server**
   ```powershell
   cd backend
   npm start
   ```

5. **Check Browser Console**
   - Look for detailed error messages
   - Check Network tab for failed requests
   - Verify request URLs are correct

## Common Network Error Types

### ERR_NETWORK
- **Cause**: Server unreachable, firewall blocking, CORS issues
- **Solution**: Check if backend is running, verify port, check firewall settings

### ERR_CONNECTION_REFUSED
- **Cause**: No server listening on the specified port
- **Solution**: Start the backend server or check port configuration

### CORS Errors
- **Cause**: Cross-origin requests blocked by browser
- **Solution**: Ensure backend has proper CORS headers configured

## Testing Your Fix

After applying the fixes:

1. **Start the backend server** on port 3002
2. **Refresh your frontend** application
3. **Check the browser console** for successful API calls
4. **Verify data is loading** in the dashboard
5. **Run the test script** to confirm all endpoints work

## Additional Resources

- **Backend Health Check**: `http://localhost:3002/api/health`
- **Service Status**: `http://localhost:3002/api/status`
- **Flood Data**: `http://localhost:3002/api/flood-data`
- **Policies**: `http://localhost:3002/api/policies`

## Troubleshooting Commands

```powershell
# Check if port 3002 is in use
netstat -ano | findstr :3002

# Kill process using port 3002 (replace PID with actual process ID)
taskkill /PID <PID> /F

# Check backend directory and start server
cd backend
npm start

# Test API endpoints
.\scripts\test-backend.ps1
```

This should resolve your network connectivity issues and provide better error handling for future debugging.

