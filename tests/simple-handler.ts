#!/usr/bin/env tsx
/**
 * Test the simple payment handler
 */

import { webcrypto } from 'node:crypto';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { withX402Client } from 'mcpay/client';
import { createSigner, isEvmSignerWallet, SupportedEVMNetworks } from 'x402/types';
import { config as loadEnv } from 'dotenv';

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any;
}

loadEnv();

async function main() {
  const serverUrl = 'http://localhost:3003/mcp/04b3315b-51e4-42ce-8134-bac2cd46b900';

  console.log('Testing Simple Payment Handler\n');
  console.log('================================\n');

  console.log('Creating EVM signer...');
  const evmPrivateKey = process.env.EVM_PRIVATE_KEY!;
  const formattedEvmKey = evmPrivateKey.startsWith('0x') ? evmPrivateKey : `0x${evmPrivateKey}`;
  const evmSigner = await createSigner('base-sepolia', formattedEvmKey);

  if (!isEvmSignerWallet(evmSigner)) {
    throw new Error("Failed to create EVM signer");
  }
  console.log('✅ Signer created\n');

  console.log('Connecting to proxy...');
  const url = new URL(serverUrl);
  const transport = new StreamableHTTPClientTransport(url);
  const client = new Client({ name: 'test-simple-handler', version: '1.0.0' }, { capabilities: {} });
  await client.connect(transport);
  console.log('✅ Connected\n');

  console.log('Wrapping with X402 payment client...');
  const paymentClient = withX402Client(client, {
    wallet: {
      evm: evmSigner
    },
    confirmationCallback: async (payment) => {
      console.log('\n💰 Payment Confirmation Requested!');
      console.log(`   Options: ${payment.length}`);
      console.log(`   Network: ${payment[0].network}`);
      console.log(`   Amount: ${payment[0].maxAmountRequired}`);
      console.log('   Auto-approving...\n');
      return { network: 'base-sepolia' as typeof SupportedEVMNetworks[number] };
    }
  });
  console.log('✅ Payment client ready\n');

  console.log('Calling get-snack (paid tool)...\n');
  try {
    const result = await paymentClient.callTool({
      name: 'get-snack',
      arguments: {}
    });

    console.log('\n================================');
    if (result.isError) {
      console.log('❌ FAILED');
      console.log('================================');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('✅ SUCCESS!');
      console.log('================================');
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error: any) {
    console.log('\n================================');
    console.log('❌ EXCEPTION');
    console.log('================================');
    console.error('Error:', error.message);
  }
}

main().catch(console.error);
