#!/bin/bash
# Publish script for n8n-nodes-fluxa-mcp

set -e  # Exit on error

echo "🚀 n8n-nodes-fluxa-mcp Publishing Script"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Are you in the n8n-nodes-fluxa-mcp directory?"
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run linting
echo "🔍 Running linter..."
npm run lint || {
    echo "❌ Linting failed. Please fix the errors and try again."
    exit 1
}

# Run build
echo "🔨 Building package..."
npm run build || {
    echo "❌ Build failed. Please fix the errors and try again."
    exit 1
}

# Check if dist exists
if [ ! -d "dist" ]; then
    echo "❌ Error: dist directory not created. Build may have failed."
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Ask for version bump
echo "Current version: $(node -p "require('./package.json').version")"
echo ""
echo "What type of version bump?"
echo "  1) patch (0.1.0 → 0.1.1) - Bug fixes"
echo "  2) minor (0.1.0 → 0.2.0) - New features"
echo "  3) major (0.1.0 → 1.0.0) - Breaking changes"
echo "  4) Skip version bump"
read -p "Choose [1-4]: " version_choice

case $version_choice in
    1)
        npm version patch
        ;;
    2)
        npm version minor
        ;;
    3)
        npm version major
        ;;
    4)
        echo "⏭️  Skipping version bump"
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

NEW_VERSION=$(node -p "require('./package.json').version")
echo "📌 Version: $NEW_VERSION"
echo ""

# Ask for confirmation
read -p "🚀 Ready to publish to npm? [y/N]: " confirm
if [[ $confirm != [yY] ]]; then
    echo "❌ Publish cancelled."
    exit 0
fi

# Check if logged into npm
if ! npm whoami > /dev/null 2>&1; then
    echo "📝 Not logged into npm. Please login:"
    npm login
fi

# Publish
echo "📤 Publishing to npm..."
npm publish || {
    echo "❌ Publish failed. Check your npm credentials and try again."
    exit 1
}

echo ""
echo "✅ Successfully published n8n-nodes-fluxa-mcp@$NEW_VERSION"
echo ""
echo "📋 Next steps:"
echo "  1. Package will appear in npm registry within minutes"
echo "  2. n8n Community Nodes will auto-index it (may take a few hours)"
echo "  3. Users can install via n8n UI: Settings → Community Nodes"
echo ""
echo "🎉 Done!"
