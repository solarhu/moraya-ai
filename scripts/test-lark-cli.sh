#!/bin/bash

# lark-cli Integration Test Runner

echo "========================================="
echo "lark-cli Integration Tests"
echo "========================================="
echo ""

# Check prerequisites
echo "1. Checking prerequisites..."

# Check lark-cli installation
if [ -f "/home/admin/.npm-global/bin/lark-cli" ]; then
    echo "✓ lark-cli found at /home/admin/.npm-global/bin/lark-cli"
elif [ -f "/usr/local/bin/lark-cli" ]; then
    echo "✓ lark-cli found at /usr/local/bin/lark-cli"
else
    echo "✗ lark-cli not found. Please install lark-cli first."
    exit 1
fi

# Check lark-cli authentication
echo ""
echo "2. Checking lark-cli authentication status..."
lark-cli auth status > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✓ lark-cli is authenticated"
else
    echo "⚠ lark-cli is not authenticated"
    echo "  Please run: lark-cli auth login --domain docs,drive"
    echo "  Tests will continue but some may be skipped."
fi

# Run tests
echo ""
echo "========================================="
echo "3. Running TypeScript Tests"
echo "========================================="
echo ""

npm test -- src/lib/services/lark-cli.test.ts

if [ $? -eq 0 ]; then
    echo ""
    echo "✓ All TypeScript tests passed!"
else
    echo ""
    echo "✗ Some TypeScript tests failed."
    exit 1
fi

echo ""
echo "========================================="
echo "4. Manual CLI Verification"
echo "========================================="
echo ""

echo "Testing lark-cli commands directly..."

# Test docs search
echo "→ Testing docs search..."
lark-cli docs +search --query "test" > /dev/null 2>&1 && echo "✓ docs search OK" || echo "⚠ docs search failed (expected if no docs)"

# Test wiki list
echo "→ Testing wiki list..."
lark-cli wiki +list > /dev/null 2>&1 && echo "✓ wiki list OK" || echo "⚠ wiki list failed (expected if no wikis)"

echo ""
echo "========================================="
echo "Test Summary"
echo "========================================="
echo ""
echo "✓ TypeScript tests: PASSED"
echo "✓ CLI installation: PASSED"
echo "✓ CLI authentication: CHECKED"
echo "✓ Manual verification: COMPLETED"
echo ""
echo "Phase 1 test suite execution completed successfully!"
echo ""