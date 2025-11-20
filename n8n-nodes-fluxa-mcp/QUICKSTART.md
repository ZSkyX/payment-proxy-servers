# Quick Start Guide

Get started with FluxA MCP node in 5 minutes!

## Step 1: Install the Node

### Option A: Via n8n Community Nodes (Recommended)

1. Open n8n
2. Go to **Settings** → **Community Nodes**
3. Click **Install**
4. Enter: `n8n-nodes-fluxa-mcp`
5. Click **Install**
6. Restart n8n

### Option B: Manual Installation (Development)

```bash
cd ~/.n8n/custom
git clone https://github.com/FluxA-Agent-Payment/payment-proxy-servers.git
cd payment-proxy-servers/n8n-nodes-fluxa-mcp
npm install
npm run build
# Restart n8n
```

## Step 2: Create FluxA Credentials

1. In n8n, click **Credentials** → **New**
2. Search for **FluxA API**
3. Fill in:
   ```
   Email: your@email.com
   Agent Name: n8n - My Instance
   FluxA Wallet Service URL: https://walletapi.fluxapay.xyz
   Payment Network: base
   ```
4. Click **Create**

## Step 3: Create Your First Workflow

1. Create a new workflow
2. Add a **Manual Trigger** node
3. Add a **FluxA MCP** node
4. Configure the FluxA MCP node:
   ```
   Credentials: [Select your FluxA API credential]
   Operation: Call Tool
   MCP Server URL: https://api.fluxapay.xyz/mcp/demo-weather-server
   Tool Name: get-weather
   Tool Arguments: { "city": "Tokyo" }
   ```
5. Connect Manual Trigger → FluxA MCP
6. Click **Execute Workflow**

## Step 4: Handle Authorization (First Time Only)

If you see an error like:
```
Agent needs to be authorized
Please visit: https://agentwallet.fluxapay.xyz/add-agent?agentId=...
```

1. Click the link
2. Authorize your agent in FluxA wallet
3. Return to n8n
4. Click **Execute Workflow** again

## Step 5: View Results

You should see output like:
```json
{
  "toolName": "get-weather",
  "result": "The weather in Tokyo is sunny, 22°C",
  "fullResult": { ... },
  "_meta": {
    "settlement": {
      "success": true,
      "transaction": "0x1234...",
      "network": "base"
    }
  }
}
```

## Common Use Cases

### 1. Weather Bot

```
Manual Trigger → Set City → FluxA MCP (get-weather) → Send Email
```

### 2. Data Processing

```
Webhook → FluxA MCP (analyze-data) → Database → Slack
```

### 3. Scheduled Reports

```
Cron → FluxA MCP (generate-report) → Google Sheets → Email
```

## Payment Information

- Payments are handled **automatically**
- Your FluxA wallet is used for transactions
- Settlement info is included in results
- Supported networks: Base, Avalanche, Solana, and testnets

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Agent registration failed" | Check email/name, verify internet |
| "Payment requires approval" | Click approval URL, approve in wallet |
| "Agent needs authorization" | Click auth URL, authorize in wallet |
| "Network not supported" | Try different network in options |

## Next Steps

- [Full Documentation](README.md)
- [FluxA Docs](https://docs.fluxapay.xyz)
- [Example Workflows](examples/)
- [Get Support](https://github.com/FluxA-Agent-Payment/payment-proxy-servers/issues)

## Need Help?

- 💬 [n8n Community Forum](https://community.n8n.io)
- 📧 Email: support@fluxapay.xyz
- 🐛 [Report Issues](https://github.com/FluxA-Agent-Payment/payment-proxy-servers/issues)
