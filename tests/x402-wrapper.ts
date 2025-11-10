#!/usr/bin/env tsx
import { webcrypto } from 'node:crypto';
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { withX402Client } from 'mcpay/client'
import { createSigner, isEvmSignerWallet, SupportedEVMNetworks } from 'x402/types'
import { config as loadEnv } from 'dotenv';

// Polyfill crypto for Node.js environment
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any;
}

loadEnv();

async function main() {
  console.log('Creating MCP client with mcpay payment support...');
  console.log('URL: http://localhost:3003/mcp/04b3315b-51e4-42ce-8134-bac2cd46b900');
  console.log('EVM Private Key:', process.env.EVM_PRIVATE_KEY ? 'Set' : 'Not set');
  console.log('');

  // Ensure private key has 0x prefix
  const evmPrivateKey = process.env.EVM_PRIVATE_KEY!;
  const formattedEvmKey = evmPrivateKey.startsWith('0x') ? evmPrivateKey : `0x${evmPrivateKey}`;

  // Create signer for EVM network
  const evmSigner = await createSigner('base-sepolia', formattedEvmKey)

  if (!isEvmSignerWallet(evmSigner)) {
    throw new Error("Failed to create EVM signer");
  }

  console.log('EVM Signer created');

  const url = new URL('http://localhost:3003/mcp/04b3315b-51e4-42ce-8134-bac2cd46b900')

  // Create transport
  const transport = new StreamableHTTPClientTransport(url)
  console.log('Transport created for MCP server');
  // Initialize MCP client
  const client = new Client({ name: 'my-mcp-client', version: '1.0.0' }, { capabilities: {} })
  await client.connect(transport)
  console.log('MCP client connected');

  // Wrap client with X402 payment capabilities
  const paymentClient = withX402Client(client, {
    wallet: {
      evm: evmSigner
    },
    confirmationCallback: async (payment) => {
      const readline = await import("readline");

      console.log("Payment available on the following networks:");
      console.log(payment)
      payment.forEach(payment => {
        console.log("-", payment.network, payment.maxAmountRequired, payment.asset);
      });

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      return new Promise((resolve) => {
      rl.question("Type the network to confirm payment: ", (answer: string) => {
          rl.close();
          if(SupportedEVMNetworks.includes(answer as typeof SupportedEVMNetworks[number])) {
            resolve({network: answer as typeof SupportedEVMNetworks[number]});
          }
          resolve(false);
        });
      });
    }
  })
  console.log('Payment client wrapped with X402 capabilities');
  console.log('');

  console.log('Listing available tools...');
  const tools = await paymentClient.listTools()
  console.log('Available tools:', tools.tools.map(t => t.name));
  console.log('');

  console.log('Calling get-snack tool...');
  try {
    const result = await paymentClient.callTool({
      name: 'get-snack',
      arguments: {}
    });

    console.log('Success!', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Failed:', error);
  }
}

main().catch(console.error);
