#!/usr/bin/env node
/**
 * MCP Stdio Server that wraps an X402 payment-enabled client
 * This allows Claude Code to connect via stdio while the server handles payments internally
 */

import { webcrypto } from 'node:crypto';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { createPaymentClient } from './payment-client.js';
import { config as loadEnv } from 'dotenv';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
// Polyfill crypto for Node.js environment
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any;
}

loadEnv();

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const urlIndex = args.indexOf('--url');

  if (urlIndex === -1 || !args[urlIndex + 1]) {
    console.error('Error: --url argument is required');
    console.error('Usage: npx tsx src/client-proxy/stdio-server.ts --url <mcp-server-url>');
    process.exit(1);
  }

  const serverUrl = args[urlIndex + 1];

  console.error('Creating MCP client with FluxA Wallet Service payment support...');
  console.error('URL:', serverUrl);

  // FluxA configuration
  const fluxaWalletServiceUrl = process.env.FLUXA_WALLET_SERVICE_URL || "https://walletapi.fluxapay.xyz";
  const evmNetwork = process.env.EVM_NETWORK || "base";

  // Check for agent registration credentials
  const agentEmail = process.env.AGENT_EMAIL;
  const agentName = process.env.AGENT_NAME || "Claude Code - My Agent";
  const clientInfo = process.env.CLIENT_INFO || "FluxA Connect MCP Client";

  if (!agentEmail || !agentName) {
    console.error('Error: AGENT_EMAIL and AGENT_NAME environment variables are required');
    console.error('');
    console.error('Example:');
    console.error('  AGENT_EMAIL=your@email.com');
    console.error('  AGENT_NAME="Claude Code - Your Name"');
    console.error('  CLIENT_INFO="Claude Code on macOS" (optional)');
    process.exit(1);
  }

  // Register agent with FluxA and get JWT
  console.error('Registering agent with FluxA...');
  console.error('Email:', agentEmail);
  console.error('Agent Name:', agentName);

  let agentJwt: string;
  let agentId: string;

  try {
    const response = await fetch("https://agentid.fluxapay.xyz/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: agentEmail,
        agent_name: agentName,
        client_info: clientInfo,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Registration failed");
    }

    agentJwt = data.jwt;
    agentId = data.agent_id;

    console.error('✓ Agent registered successfully');
    console.error('Agent ID:', agentId);
    console.error('JWT obtained');
  } catch (error: any) {
    console.error('✗ Agent registration failed:', error.message);
    console.error('');
    console.error('Please check:');
    console.error('  - Your email and agent name are correct');
    console.error('  - You have internet connectivity');
    console.error('  - FluxA registration service is available');
    process.exit(1);
  }

  const url = new URL(serverUrl);

  // Create transport
  const transport = new StreamableHTTPClientTransport(url);

  // Initialize MCP client
  const client = new Client({ name: 'x402-proxy-client', version: '1.0.0' }, { capabilities: {} });
  await client.connect(transport);

  console.error('MCP client connected');

  // Get preferred network from environment

  // Wrap client with FluxA X402 payment capabilities
  const paymentClient = createPaymentClient(client, {
    fluxaWalletServiceUrl,
    agentJwt,
    agentName,
    network: evmNetwork,
    confirmationCallback: async (paymentOptions) => {
      console.error("Payment requested on the following networks:");
      paymentOptions.forEach(p => {
        console.error(`- ${p.network}: ${p.maxAmountRequired} (${p.description})`);
      });

      console.error(`Using network: ${evmNetwork}`);
      return true; // Auto-approve (user approves via FluxA UI)
    }
  });
  console.error('Payment client configured with FluxA Wallet Service');

  // List available tools from upstream
  const upstreamTools = await paymentClient.listTools();
  console.error('Available upstream tools:', upstreamTools.tools.map(t => t.name));
  console.error('Full tool metadata:', JSON.stringify(upstreamTools.tools, null, 2));

  // Create MCP stdio server
  const server = new Server(
    {
      name: 'fluxa-connect-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register handlers using the correct MCP SDK API
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    // Forward tool list from upstream
    return upstreamTools;
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params as { name: string; arguments?: any };

    console.error(`[STDIO-SERVER] Calling tool: ${name}`);
    console.error(`[STDIO-SERVER] Tool arguments:`, JSON.stringify(args, null, 2));

    try {
      // Forward tool call to payment-enabled client
      console.error(`[STDIO-SERVER] Forwarding to paymentClient.callTool...`);
      const result = await paymentClient.callTool({
        name,
        arguments: args
      });

      console.error(`[STDIO-SERVER] Tool ${name} succeeded`);
      return result;
    } catch (error) {
      console.error(`[STDIO-SERVER] Tool ${name} failed:`, error);
      throw error;
    }
  });

  // Connect server to stdio
  const stdioTransport = new StdioServerTransport();
  await server.connect(stdioTransport);

  console.error('X402 Proxy MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
