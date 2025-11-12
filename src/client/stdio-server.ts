#!/usr/bin/env tsx
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

  // Check required environment variables
  const fluxaWalletServiceUrl = process.env.FLUXA_WALLET_SERVICE_URL;
  const agentJwt = process.env.AGENT_JWT;

  if (!fluxaWalletServiceUrl) {
    console.error('Error: FLUXA_WALLET_SERVICE_URL environment variable is required');
    process.exit(1);
  }

  if (!agentJwt) {
    console.error('Error: AGENT_JWT environment variable is required');
    console.error('Get your JWT from FluxA Wallet Service after agent authorization');
    process.exit(1);
  }

  console.error('FluxA Wallet Service URL:', fluxaWalletServiceUrl);
  console.error('Agent JWT:', agentJwt.substring(0, 20) + '...');

  const url = new URL(serverUrl);

  // Create transport
  const transport = new StreamableHTTPClientTransport(url);

  // Initialize MCP client
  const client = new Client({ name: 'x402-proxy-client', version: '1.0.0' }, { capabilities: {} });
  await client.connect(transport);

  console.error('MCP client connected');

  // Get preferred network from environment
  const evmNetwork = process.env.EVM_NETWORK;

  // Wrap client with FluxA X402 payment capabilities
  const paymentClient = createPaymentClient(client, {
    fluxaWalletServiceUrl,
    agentJwt,
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
      name: 'snack-server',
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
