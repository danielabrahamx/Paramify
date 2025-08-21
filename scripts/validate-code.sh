#!/bin/bash

# Code Validation Script for ICP Flood Insurance Dapp
# This script validates the code structure without requiring dfx

echo "🔍 Validating ICP Flood Insurance Dapp Code Structure"
echo "=================================================="

# Check if required files exist
echo "📁 Checking file structure..."
REQUIRED_FILES=(
    "src/main.mo"
    "src/main.did"
    "src/main.test.mo"
    "frontend/src/ICPFloodInsuranceDashboard.tsx"
    "frontend/src/lib/icp-integration.ts"
    "scripts/deploy-testnet.sh"
    "scripts/run-tests.sh"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file - MISSING"
    fi
done

echo ""
echo "🔧 Validating Motoko syntax..."

# Check for basic Motoko syntax patterns
echo "Checking import statements..."
IMPORT_COUNT=$(grep -c "^import" src/main.mo)
echo "  - Import statements: $IMPORT_COUNT"

echo "Checking function definitions..."
FUNC_COUNT=$(grep -c "func.*async" src/main.mo)
echo "  - Async functions: $FUNC_COUNT"

echo "Checking type definitions..."
TYPE_COUNT=$(grep -c "public type" src/main.mo)
echo "  - Public types: $TYPE_COUNT"

echo "Checking error handling..."
ERROR_COUNT=$(grep -c "#err" src/main.mo)
echo "  - Error returns: $ERROR_COUNT"

echo ""
echo "🧪 Validating test structure..."

# Check test file structure
TEST_SUITES=$(grep -c "suite(" src/main.test.mo)
TEST_COUNT=$(grep -c "test(" src/main.test.mo)
echo "  - Test suites: $TEST_SUITES"
echo "  - Individual tests: $TEST_COUNT"

echo ""
echo "📱 Validating frontend code..."

# Check if frontend builds
cd frontend
if npm run build > /dev/null 2>&1; then
    echo "✅ Frontend builds successfully"
else
    echo "❌ Frontend build failed"
fi
cd ..

echo ""
echo "📋 Validating deployment scripts..."

# Check script permissions
if [ -x "scripts/deploy-testnet.sh" ]; then
    echo "✅ deploy-testnet.sh is executable"
else
    echo "❌ deploy-testnet.sh is not executable"
fi

if [ -x "scripts/run-tests.sh" ]; then
    echo "✅ run-tests.sh is executable"
else
    echo "❌ run-tests.sh is not executable"
fi

echo ""
echo "🔍 Code structure validation complete!"
echo ""
echo "📊 Summary:"
echo "  - Required files: $(find . -name "*.mo" -o -name "*.tsx" -o -name "*.sh" | grep -E "(main|ICPFloodInsuranceDashboard|deploy|run-tests)" | wc -l)"
echo "  - Total functions: $FUNC_COUNT"
echo "  - Test coverage: $TEST_COUNT tests in $TEST_SUITES suites"
echo ""
echo "⚠️  Note: This is a structural validation only."
echo "   Full testing requires dfx to be installed and running."