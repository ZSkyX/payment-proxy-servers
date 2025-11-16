# FluxA Connect MCP

MCP (Model Context Protocol) client with FluxA Wallet Service integration for X402 payments.

## Installation

Install via npx (no installation needed):

```bash
npx @fluxa-pay/fluxa-connect-mcp@latest --url <your-mcp-server-url>
```

## Usage with Claude Code

Add to your `.mcp.json` or use the Claude Code CLI:

```bash
claude mcp add-json fluxa-connect '{
  "command": "npx",
  "args": [
    "-y",
    "@fluxa-pay/fluxa-connect-mcp@latest",
    "--url",
    "https://api.fluxapay.xyz/mcp/<your-config-id>"
  ],
  "env": {
    "AGENT_EMAIL": "your@email.com",
    "AGENT_NAME": "Claude Code - Your Name"
  }
}'
```

## Environment Variables

### Required

- **`AGENT_EMAIL`**: Your email address for agent registration
  - Example: `your@email.com`

- **`AGENT_NAME`**: A descriptive name for your agent
  - Example: `"Claude Code - John's MacBook"`
  - This helps identify the agent in FluxA dashboard

### Optional

- **`CLIENT_INFO`**: Description of your runtime environment
  - Default: `"FluxA Connect MCP Client"`
  - Example: `"Claude Code on macOS 14.1"`

### Advanced (Usually not needed)

- **`FLUXA_WALLET_SERVICE_URL`**: FluxA Wallet Service URL
  - Default: `https://walletapi.fluxapay.xyz`

- **`EVM_NETWORK`**: EVM network to use for payments
  - Default: `base`
  - Options: `base`, `base-sepolia` (coming soon: `avalanche`, `avalanche-fuji`, `iotex`, `sei`, `sei-testnet`)

## How It Works

1. On startup, the client registers your agent with FluxA using your email and agent name
2. The client receives a JWT token for authentication
3. The client connects to your MCP server via the `--url` parameter
4. When a tool requires payment (X402), the client automatically:
   - Detects the payment requirement
   - Calls FluxA Wallet Service to create a payment transaction
   - Retries the tool call with the payment attached
5. All payments are handled through FluxA's infrastructure

## Example

```bash
# Basic usage
AGENT_EMAIL="your@email.com" \
npx @fluxa-pay/fluxa-connect-mcp@latest \
  --url https://api.fluxapay.xyz/mcp/abc-123

# With custom settings (advanced)
AGENT_EMAIL="your@email.com" \
AGENT_NAME="Claude Code - My Agent" \
CLIENT_INFO="Claude Code on macOS" \
EVM_NETWORK="base-sepolia" \
npx @fluxa-pay/fluxa-connect-mcp@latest \
  --url https://api.fluxapay.xyz/mcp/abc-123
```
