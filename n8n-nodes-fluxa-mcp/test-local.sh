#!/bin/bash
# Quick local testing script for n8n-nodes-fluxa-mcp

set -e

echo "🧪 FluxA MCP Node - Local Testing Setup"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this from n8n-nodes-fluxa-mcp directory"
    exit 1
fi

# Check if n8n is installed
if ! command -v n8n &> /dev/null; then
    echo "⚠️  n8n not found globally"
    echo ""
    read -p "Install n8n globally? [y/N]: " install_n8n
    if [[ $install_n8n == [yY] ]]; then
        echo "📦 Installing n8n..."
        npm install -g n8n
    else
        echo "ℹ️  You can use: npx n8n start"
    fi
fi

# Clean and reinstall dependencies to ensure overrides are applied
echo "📦 Installing dependencies..."
rm -rf node_modules package-lock.json
npm install

# Build the package
echo "🔨 Building package..."
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Build failed - dist directory not created"
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Link the package
echo "🔗 Linking package..."
npm link

# Create n8n custom directory if needed
mkdir -p ~/.n8n/custom

# Clean old installation in n8n custom directory
echo "🧹 Cleaning old installation..."
rm -rf ~/.n8n/custom/node_modules/n8n-nodes-fluxa-mcp

# Link in n8n custom directory
cd ~/.n8n/custom
npm link n8n-nodes-fluxa-mcp
cd - > /dev/null

echo "✅ Package linked to n8n"
echo ""

# Show instructions
echo "📋 Next Steps:"
echo ""
echo "1. Start n8n:"
echo "   n8n start"
echo "   # or"
echo "   npx n8n start"
echo ""
echo "2. Open browser:"
echo "   http://localhost:5678"
echo ""
echo "3. Create FluxA API credentials:"
echo "   - Email: your@email.com"
echo "   - Agent Name: n8n - Testing"
echo "   - Wallet Service URL: https://walletapi.fluxapay.xyz"
echo "   - Payment Network: base"
echo ""
echo "4. Add FluxA MCP node to a workflow"
echo ""
echo "5. Test with a server URL:"
echo "   https://fluxa-servers-connection.up.railway.app/mcp/your-config-id"
echo ""

# Ask if user wants to start n8n now
echo ""
echo "🚀 Starting n8n..."
echo "   Press Ctrl+C to stop"
echo ""

# Check if n8n is installed globally
if command -v n8n &> /dev/null; then
    n8n start
else
    npx n8n start
fi