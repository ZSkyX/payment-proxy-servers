# FluxA Connect MCP

Automatic X402 payment handling for MCP servers in Claude Code.

## Installation

```bash
npx @fluxa-pay/fluxa-connect-mcp@latest --url <mcp-server-url>
```

## Usage with Claude Code

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": [
        "-y",
        "@fluxa-pay/fluxa-connect-mcp@latest",
        "--url",
        "https://api.fluxapay.xyz/mcp/<your-config-id>"
      ],
      "env": {
        "AGENT_EMAIL": "your@email.com",
        "AGENT_NAME": "Claude Code - agentwallet.fluxapay.xyz",
        "CLIENT_INFO": "Claude Code on macOS",
      }
    }
  }
}
```

To use it directly
```bash
claude mcp add-json <your-config-id> '{"command":"npx","args":["-y","@fluxa-pay/fluxa-connect-mcp","--url","https://fluxa-servers-connection.up.railway.app/mcp/<config-id>"],"env":{"AGENT_EMAIL":"your@email.com","AGENT_NAME":"Claude Code - agentwallet.fluxapay.xyz","CLIENT_INFO":"Claude Code on macOS"}}'
```

## Required Environment Variables

- `AGENT_EMAIL` - Your email address
- `AGENT_NAME` - A name for your agent (e.g., "Claude Code - John's Laptop")

## Optional Environment Variables

- `EVM_NETWORK` - Payment network (default: `base`)
  - Supported: `base`, `base-sepolia`, `avalanche`, `avalanche-fuji`, `iotex`, `sei`, `sei-testnet`, `polygon-amoy`, `solana`, `solana-devnet`

## Troubleshooting

**Agent not authorized?**
Open the authorization link provided in the error message.

**Payment needs approval?**
Open the approval link provided in the error message.

## Our website

Visit us at [FluxA](https://www.fluxapay.xyz/)

