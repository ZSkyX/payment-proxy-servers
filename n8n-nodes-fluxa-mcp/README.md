# n8n-nodes-fluxa-mcp

This is an n8n community node that lets you call MCP (Model Context Protocol) servers with automatic X402 payment handling via FluxA Wallet Service.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Features

- 🔧 **Call MCP Tools** - Execute tools on any MCP server
- 💳 **Automatic Payments** - Handles X402 payments automatically via FluxA
- 🔐 **Agent Registration** - Automatically registers and manages agent credentials
- 🌐 **Multi-Network Support** - Supports Base, Avalanche, Solana, and testnets
- 📋 **List Tools** - Discover available tools from MCP servers
- 💰 **Payment Transparency** - See payment settlement info in results

## Installation

### Community Node Installation

In n8n, go to **Settings > Community Nodes** and install:

```
n8n-nodes-fluxa-mcp
```

### Manual Installation (for development)

```bash
# Navigate to your n8n custom nodes folder
cd ~/.n8n/custom

# Clone or copy the node
git clone https://github.com/FluxA-Agent-Payment/payment-proxy-servers.git
cd payment-proxy-servers/n8n-nodes-fluxa-mcp

# Install dependencies and build
npm install
npm run build

# Restart n8n
```

## Configuration

### 1. Create FluxA Credentials

In n8n, create new **FluxA API** credentials with:

| Field | Description | Example |
|-------|-------------|---------|
| **Email** | Your email for agent registration | `user@example.com` |
| **Agent Name** | Unique name for this n8n instance | `n8n - Production` |
| **FluxA Wallet Service URL** | FluxA wallet endpoint | `https://walletapi.fluxapay.xyz` |
| **Payment Network** | Default blockchain network | `base` |

### 2. Authorize Your Agent

After the first run, if you see an authorization error:

1. The error message will include an authorization URL
2. Click the URL to authorize your agent in FluxA wallet
3. Retry the workflow

## Operations

### Call Tool

Execute a tool on an MCP server with automatic payment handling.

**Parameters:**
- **MCP Server URL** - The HTTP endpoint of the MCP server
  - Example: `https://api.fluxapay.xyz/mcp/your-config-id`
- **Tool Name** - Name of the tool to call
  - Example: `get-weather`
- **Tool Arguments** - JSON object with tool parameters
  - Example: `{ "city": "Tokyo", "units": "metric" }`

**Options:**
- **Override Network** - Override the default payment network
- **Auto Approve Payments** - Automatically approve payments (default: true)

**Output:**
```json
{
  "toolName": "get-weather",
  "result": "The weather in Tokyo is...",
  "fullResult": { /* MCP result object */ },
  "_meta": {
    "serverUrl": "https://api.fluxapay.xyz/mcp/abc123",
    "agentId": "550e8400-e29b-41d4-a716-446655440000",
    "settlement": {
      "success": true,
      "transaction": "0x1234...",
      "network": "base"
    }
  }
}
```

### List Tools

Get a list of available tools from an MCP server.

**Parameters:**
- **MCP Server URL** - The HTTP endpoint of the MCP server

**Output:**
```json
{
  "tools": [
    {
      "name": "get-weather",
      "description": "Get current weather for a city",
      "inputSchema": { /* JSON schema */ }
    }
  ],
  "_meta": {
    "serverUrl": "https://api.fluxapay.xyz/mcp/abc123",
    "agentId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

## Example Workflow

### Simple Weather Check

1. Add **FluxA MCP** node
2. Set operation to **Call Tool**
3. Configure:
   - Server URL: `https://api.fluxapay.xyz/mcp/your-weather-config`
   - Tool Name: `get-weather`
   - Tool Arguments: `{ "city": "Tokyo" }`
4. Run workflow - payment is handled automatically!

### Dynamic Tool Execution

```json
{
  "nodes": [
    {
      "name": "Get City from Input",
      "type": "n8n-nodes-base.set",
      "parameters": {
        "values": {
          "city": "={{ $json.userInput }}"
        }
      }
    },
    {
      "name": "Call Weather Tool",
      "type": "n8n-nodes-fluxa-mcp.fluxaMcp",
      "parameters": {
        "operation": "callTool",
        "serverUrl": "https://api.fluxapay.xyz/mcp/weather-server",
        "toolName": "get-weather",
        "toolArguments": "={{ { \"city\": $json.city } }}"
      },
      "credentials": {
        "fluxaApi": "My FluxA Account"
      }
    }
  ]
}
```

## Payment Flow

When you call a paid tool:

1. **First Request** → MCP server returns 402 Payment Required
2. **Payment Creation** → Node automatically calls FluxA Wallet Service
3. **Payment Verification** → FluxA verifies and creates payment token
4. **Retry Request** → Node retries with payment token
5. **Settlement** → Payment is settled on-chain
6. **Tool Execution** → MCP server executes the tool
7. **Result** → You get the result with settlement metadata

All of this happens **automatically** - you just call the tool!

## Supported Networks

- **Mainnets**: `base`, `avalanche`, `solana`, `iotex`, `sei`
- **Testnets**: `base-sepolia`, `avalanche-fuji`, `solana-devnet`, `sei-testnet`, `polygon-amoy`

## Error Handling

The node handles various error scenarios:

- **Agent Not Authorized** → Returns authorization URL
- **Payment Approval Required** → Returns approval URL
- **Insufficient Funds** → Returns clear error message
- **Network Issues** → Retries with exponential backoff
- **Tool Execution Errors** → Returns error details

Enable "Continue on Fail" in n8n to handle errors gracefully in workflows.

## Troubleshooting

### "Agent registration failed"
- Check your email and agent name are correct
- Verify internet connectivity
- Ensure FluxA services are available

### "Payment requires approval"
- Click the approval URL in the error message
- Approve the payment in FluxA wallet
- Retry the workflow

### "Agent needs to be authorized"
- Click the authorization URL in the error message
- Authorize your agent in FluxA wallet
- Retry the workflow

### "Payment network not supported"
- Check the MCP server's supported networks
- Try a different network in Options > Override Network

## Resources

- [FluxA Documentation](https://docs.fluxapay.xyz)
- [FluxA Wallet](https://agentwallet.fluxapay.xyz)
- [MCP Protocol](https://modelcontextprotocol.io)
- [n8n Community](https://community.n8n.io)

## License

[MIT](LICENSE.md)

## Support

- Report issues: [GitHub Issues](https://github.com/FluxA-Agent-Payment/payment-proxy-servers/issues)
- Email: support@fluxapay.xyz
- Website: [fluxapay.xyz](https://www.fluxapay.xyz)
