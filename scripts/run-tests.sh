#!/bin/bash

# ICP Test Execution Script for Flood Insurance Dapp
# This script runs the comprehensive test suite on the deployed canister

set -e

echo "🧪 Running ICP Flood Insurance Dapp Test Suite"

# Check if dfx is installed
if ! command -v dfx &> /dev/null; then
    echo "❌ dfx is not installed. Please install dfx first:"
    echo "   sh -ci \"\$(curl -fsSL https://internetcomputer.org/install.sh)\""
    exit 1
fi

# Check if network is set
NETWORK=${1:-"local"}
if [ "$NETWORK" = "testnet" ]; then
    echo "🌐 Running tests on ICP testnet..."
    dfx config --local network ic0.testnet
else
    echo "🏠 Running tests on local network..."
    dfx config --local network local
fi

# Check if canister is deployed
if ! dfx canister id main &> /dev/null; then
    echo "❌ Canister 'main' not found. Please deploy first:"
    echo "   dfx deploy"
    exit 1
fi

# Build and deploy test canister
echo "🔨 Building test canister..."
dfx build main-test

echo "🚀 Deploying test canister..."
dfx deploy main-test

# Run the comprehensive test suite
echo "🧪 Executing comprehensive test suite..."
echo "=========================================="

TEST_RESULT=$(dfx canister call main-test runTests)

echo ""
echo "📊 Test Results:"
echo "=========================================="
echo "$TEST_RESULT"
echo "=========================================="

# Check if tests passed
if echo "$TEST_RESULT" | grep -q "All tests passed"; then
    echo ""
    echo "✅ All tests passed successfully!"
    echo "🎉 End-to-end functionality verified!"
    
    # Run additional validation tests
    echo ""
    echo "🔍 Running additional validation tests..."
    
    # Test canister status
    echo "📊 Canister Status:"
    dfx canister call main canisterStatus
    
    # Test basic functionality
    echo ""
    echo "🔧 Testing basic functionality..."
    echo "Hello message:"
    dfx canister call main hello
    
    echo ""
    echo "Contract balance:"
    dfx canister call main getContractBalance
    
    echo ""
    echo "Flood threshold:"
    dfx canister call main getThreshold
    
else
    echo ""
    echo "❌ Some tests failed!"
    echo "🔍 Review the test output above for details"
    echo ""
    echo "💡 Common issues and solutions:"
    echo "   1. Check canister deployment status"
    echo "   2. Verify network configuration"
    echo "   3. Check cycles balance"
    echo "   4. Review canister logs: dfx canister call main getStats"
    
    exit 1
fi

echo ""
echo "🎯 Test execution completed!"
echo ""
echo "📋 Next steps:"
echo "   1. Review test results above"
echo "   2. Check canister logs if needed"
echo "   3. Deploy to mainnet if all tests pass"
echo "   4. Update documentation with results"