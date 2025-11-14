#!/usr/bin/env tsx
/**
 * Test script for debugging payment-client.ts
 * Tests the createPaymentClient wrapper with a mock MCP client
 *
 * Usage:
 *   npx tsx tests/test-payment-client.ts
 */

import { webcrypto } from 'node:crypto';
import { config as loadEnv } from 'dotenv';
import { createPaymentClient } from '../src/client/payment-client.js';

// Polyfill crypto for Node.js environment
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any;
}

loadEnv();

// Test configuration
const FLUXA_WALLET_SERVICE_URL = 'https://walletapi.fluxapay.xyz';
const EVM_NETWORK = 'base';
const AGENT_EMAIL = process.env.AGENT_EMAIL || 'test@example.com';
const AGENT_NAME = process.env.AGENT_NAME || 'Test Agent';
const TEST_RESOURCE_URL = 'http://localhost:3003/mcp/test-config-id';

console.log('=== Payment Client Test ===');
console.log('FluxA Wallet Service URL:', FLUXA_WALLET_SERVICE_URL);
console.log('Agent Email:', AGENT_EMAIL);
console.log('Agent Name:', AGENT_NAME);
console.log('EVM Network:', EVM_NETWORK);
console.log('');

// Register agent to get JWT
console.log('Registering agent with FluxA...');
let AGENT_JWT: string;
let AGENT_ID: string;

async function registerAgent() {
  try {
    const response = await fetch("https://agentid.fluxapay.xyz/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: AGENT_EMAIL,
        agent_name: AGENT_NAME,
        client_info: "Payment Client Test Script",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Registration failed");
    }

    AGENT_JWT = data.jwt;
    AGENT_ID = data.agent_id;

    console.log('✓ Agent registered successfully');
    console.log('Agent ID:', AGENT_ID);
    console.log('JWT obtained (first 50 chars):', AGENT_JWT.substring(0, 50) + '...');
    console.log('');

    // Decode JWT to check payload
    try {
      const jwtParts = AGENT_JWT.split('.');
      if (jwtParts.length === 3) {
        const payload = JSON.parse(Buffer.from(jwtParts[1], 'base64').toString());
        console.log('JWT Payload:', JSON.stringify(payload, null, 2));
        console.log('');
      }
    } catch (error) {
      console.error('Failed to decode JWT:', error);
    }
  } catch (error: any) {
    console.error('✗ Agent registration failed:', error.message);
    throw error;
  }
}

// Mock MCP Client
class MockMCPClient {
  private callCount = 0;

  async callTool(params: any, resultSchema?: any, options?: any): Promise<any> {
    this.callCount++;
    console.log(`\n[MockMCPClient] callTool called (attempt ${this.callCount})`);
    console.log('[MockMCPClient] params:', JSON.stringify(params, null, 2));

    // First call: return payment required error
    if (this.callCount === 1) {
      console.log('[MockMCPClient] Returning payment required error (402)');
      return {
        isError: true,
        content: [{ type: 'text', text: 'Payment required' }],
        _meta: {
          'x402/error': {
            accepts: [
              {
                scheme: "exact",
                network: "base",
                maxAmountRequired: "100",
                payTo: "0x23330fCd94b07943804367C677D6a11D26e4b728",
                asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
                maxTimeoutSeconds: 300,
                resource: TEST_RESOURCE_URL,
                mimeType: "application/json",
                description: "Get a random snack from the snack list",
                extra: {
                  name: "USDC Coin",
                  version: "2"
                }
              }
            ]
          }
        }
      };
    }

    // Second call: should include payment token
    if (this.callCount === 2) {
      console.log('[MockMCPClient] Payment token provided!');
      const paymentToken = params._meta?.['x402/payment'];
      if (paymentToken) {
        console.log('[MockMCPClient] Payment token (first 100 chars):', paymentToken.substring(0, 100));
        // Decode and show payment
        try {
          const decoded = JSON.parse(Buffer.from(paymentToken, 'base64').toString());
          console.log('[MockMCPClient] Decoded payment:', JSON.stringify(decoded, null, 2));
        } catch (e) {
          console.error('[MockMCPClient] Failed to decode payment token');
        }

        // Return success
        return {
          isError: false,
          content: [{
            type: 'text',
            text: JSON.stringify({ snack: 'Chocolate Chip Cookie', price: 0.0001 })
          }]
        };
      } else {
        console.error('[MockMCPClient] ERROR: No payment token provided on second call!');
        return {
          isError: true,
          content: [{ type: 'text', text: 'Payment token missing' }]
        };
      }
    }

    // Unexpected call
    return {
      isError: true,
      content: [{ type: 'text', text: 'Unexpected call' }]
    };
  }
}

// Test the payment client
async function testPaymentClient() {
  console.log('\n=== Testing createPaymentClient ===\n');

  // Create mock client
  const mockClient = new MockMCPClient() as any;

  // Wrap with payment client
  const paymentClient = createPaymentClient(mockClient, {
    fluxaWalletServiceUrl: FLUXA_WALLET_SERVICE_URL,
    agentJwt: AGENT_JWT,
    agentName: AGENT_NAME,
    network: EVM_NETWORK,
    confirmationCallback: async (options) => {
      console.log('\n[ConfirmationCallback] Payment options received:');
      options.forEach((opt, i) => {
        console.log(`  ${i + 1}. Network: ${opt.network}, Amount: ${opt.maxAmountRequired}, PayTo: ${opt.payTo}`);
      });
      console.log('[ConfirmationCallback] Auto-approving payment\n');
      return true;
    }
  });

  // Call the tool (should trigger payment flow)
  try {
    console.log('[Test] Calling get-snack tool...\n');
    const result = await paymentClient.callTool({ name: 'get-snack', arguments: {} });

    console.log('\n[Test] Final result:');
    console.log(JSON.stringify(result, null, 2));

    if (!result.isError) {
      console.log('\n✅ SUCCESS! Payment flow completed successfully');
    } else {
      console.log('\n❌ FAILED! Result is error:', result.content[0].text);
    }
  } catch (error: any) {
    console.error('\n❌ EXCEPTION:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Main
async function main() {
  // Register agent first
  await registerAgent();

  // Run payment client test
  await testPaymentClient();

  console.log('\n=== Test Complete ===');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
