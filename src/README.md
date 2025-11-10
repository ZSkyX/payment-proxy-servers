# X402-MCP Source Code

Payment-enabled MCP proxy system using the X402 payment protocol.

## Architecture

```
Client (Claude Code)
    ↓
stdio-server.ts (client-side payment wrapper)
    ↓
proxy-multitenant.ts (server-side payment verification)
    ↓
Upstream MCP Server
```

**Payment Flow:**
1. Client calls tool → Server returns 402 error with payment requirements
2. Client creates signed payment token (EVM/Solana)
3. Client retries with payment → Server verifies via X402 facilitator
4. Server executes tool → Settles payment on-chain
5. Returns result with settlement metadata

## Directory Structure

```
src/
├── client/
│   ├── payment-client.ts       # Payment middleware for MCP clients
│   └── stdio-server.ts         # Stdio proxy for Claude Code
├── server/
│   ├── payment-handler.ts      # Payment verification & settlement
│   ├── proxy-multitenant.ts    # Multi-tenant proxy (URL-based routing)
│   ├── proxy-single.ts         # Single-tenant proxy
│   └── configure-tools.ts      # CLI for pricing configuration
├── mcp/
│   └── server.ts               # Test MCP server (e.g., snack server)
└── configs-db/
    └── {configId}.json         # Server configurations
```

## What We're Doing

Building a monetization layer for MCP tools:
- Proxy sits between clients and upstream MCP servers
- Enforces payments before forwarding requests
- Supports per-tool pricing in USD
- Handles payment verification and on-chain settlement
- Multi-tenant: single proxy serves multiple configurations

## Supported Networks

**EVM Networks (8):**
- base-sepolia, base
- avalanche-fuji, avalanche
- iotex
- sei, sei-testnet
- polygon-amoy

**Solana Networks (2):**
- solana, solana-devnet

**Payment Token:** USDC (6 decimals) on all networks

## Quick Start

```bash
# 1. Configure pricing
npm run configure

# 2. Start proxy
npm run proxy

# 3. Connect client
npx tsx src/client/stdio-server.ts --url http://localhost:3003/mcp/{configId}
```

## Configuration Format

`configs-db/{configId}.json`:
```json
{
  "upstreamUrl": "http://localhost:3004/mcp",
  "yourWallet": "0xYourAddress",
  "tools": [
    {
      "name": "get-snack",
      "description": "Get a random snack",
      "price": 0.0001,
      "enabled": true
    }
  ]
}
```
