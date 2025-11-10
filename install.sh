#!/bin/bash

# Install script for test-x402-mcp

echo "Cleaning previous installation..."
rm -rf node_modules bun.lock

echo "Installing dependencies..."
bun install

echo ""
echo "Installation complete!"
echo ""
echo "To run the tests:"
echo "  1. Copy .env.example to .env and configure your wallet"
echo "  2. Run 'bun run server' in one terminal"
echo "  3. Run 'bun run client' in another terminal"
