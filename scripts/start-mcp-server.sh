#!/bin/bash
# MCP Server Startup Script
# This script starts the X402-enabled MCP stdio server

cd "$(dirname "$0")/.."

# Use the npx from nvm
/Users/zskyx/.nvm/versions/node/v18.18.0/bin/npx tsx src/client/stdio-server.ts --url http://localhost:3003/mcp/04b3315b-51e4-42ce-8134-bac2cd46b900
