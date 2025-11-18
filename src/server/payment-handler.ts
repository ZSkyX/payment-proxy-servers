/**
 * Direct JSON-RPC payment handler bypassing mcpay facilitator
 * Implements X402 payment flow without external verification
 */

// Import node-fetch for x402 facilitator calls only (not as global polyfill)
// This avoids breaking MCP SDK's StreamableHTTPClientTransport which needs native fetch
import nodeFetch from 'node-fetch';

import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { useFacilitator } from "x402/verify";
import { decodePayment } from "x402/schemes";
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { config } from "dotenv";


config({ path: resolve(__dirname, '../../.env') });
// Store original fetch
const originalFetch = globalThis.fetch;

// Helper to temporarily use node-fetch for x402 calls (avoids undici bug)
async function withNodeFetch<T>(fn: () => Promise<T>): Promise<T> {
  try {
    // Temporarily override fetch with node-fetch
    globalThis.fetch = nodeFetch as any;
    return await fn();
  } finally {
    // Always restore original fetch
    globalThis.fetch = originalFetch;
  }
}

// Configure facilitator for payment verification at module level
// const {verify, settle} = useFacilitator({ url: "https://www.x402.org/facilitator" });
// const {verify, settle} = useFacilitator(facilitator);
const {verify, settle} = useFacilitator({ url: "https://facilitator.xechoai.xyz" });


interface ToolConfig {
  name: string;
  description: string;
  price: number;
  enabled: boolean;
  input_schema?: any;
}

interface ServerConfig {
  upstreamUrl: string;
  yourWallet: string;
  tools: ToolConfig[];
}

// Payment network configurations
interface NetworkConfig {
  network: string;
  asset: string;
  decimals: number;
  symbol: string;
  name: string;
  version: string;
  type: "evm" | "svm"; // EVM or Solana Virtual Machine
}

const PAYMENT_NETWORKS: Record<string, NetworkConfig> = {
  'base-sepolia': {
    network: 'base-sepolia',
    asset: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    decimals: 6,
    symbol: 'USDC',
    name: 'USD Coin',
    version: '2',
    type: 'evm'
  },
  'base': {
    network: 'base',
    asset: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    decimals: 6,
    symbol: 'USDC',
    name: 'USD Coin',
    version: '2',
    type: 'evm'
  },
  'avalanche-fuji': {
    network: 'avalanche-fuji',
    asset: '0x5425890298aed601595a70AB815c96711a31Bc65',
    decimals: 6,
    symbol: 'USDC',
    name: 'USD Coin',
    version: '2',
    type: 'evm'
  },
  'avalanche': {
    network: 'avalanche',
    asset: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    decimals: 6,
    symbol: 'USDC',
    name: 'USDC',
    version: '2',
    type: 'evm'
  },
  'iotex': {
    network: 'iotex',
    asset: '0xcdf79194c6c285077a58da47641d4dbe51f63542',
    decimals: 6,
    symbol: 'USDC',
    name: 'USD Coin',
    version: '2',
    type: 'evm'
  },
  'sei': {
    network: 'sei',
    asset: '0xe15fc38f6d8c56af07bbcbe3baf5708a2bf42392',
    decimals: 6,
    symbol: 'USDC',
    name: 'USD Coin',
    version: '2',
    type: 'evm'
  },
  'sei-testnet': {
    network: 'sei-testnet',
    asset: '0x4fcf1784b31630811181f670aea7a7bef803eaed',
    decimals: 6,
    symbol: 'USDC',
    name: 'USD Coin',
    version: '2',
    type: 'evm'
  },
  'polygon-amoy': {
    network: 'polygon-amoy',
    asset: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582',
    decimals: 6,
    symbol: 'USDC',
    name: 'USD Coin',
    version: '2',
    type: 'evm'
  },
  'solana': {
    network: 'solana',
    asset: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    symbol: 'USDC',
    name: 'USD Coin',
    version: '1',
    type: 'svm'
  },
  'solana-devnet': {
    network: 'solana-devnet',
    asset: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    decimals: 6,
    symbol: 'USDC',
    name: 'USD Coin',
    version: '1',
    type: 'svm'
  }
};

// Helper to build payment network annotation for tools/list
function buildPaymentNetworkAnnotation(
  networkId: string,
  recipient: string,
  price: number
) {
  const config = PAYMENT_NETWORKS[networkId];
  return {
    network: config.network,
    recipient,
    maxAmountRequired: Math.floor(price * 1_000_000).toString(),
    asset: {
      address: config.asset,
      decimals: config.decimals,
      symbol: config.symbol
    },
    type: config.type
  };
}

// Helper to build payment requirement for x402 error
function buildPaymentRequirement(
  networkId: string,
  recipient: string,
  price: number,
  toolName: string,
  description: string,
  serverUrl: string
) {
  const config = PAYMENT_NETWORKS[networkId];

  // For EVM networks, cast to 0x format; for Solana, use as-is
  const payTo = config.type === 'evm' ? recipient as `0x${string}` : recipient;
  const asset = config.type === 'evm' ? config.asset as `0x${string}` : config.asset;

  return {
    scheme: "exact" as const,
    network: config.network,
    maxAmountRequired: Math.floor(price * 1_000_000).toString(),
    payTo: payTo as any,
    asset: asset as any,
    maxTimeoutSeconds: 300,
    resource: serverUrl,
    mimeType: "application/json",
    description,
    extra: { name: config.name, version: config.version }
  };
}

export function createDirectPaymentHandler(
  config: ServerConfig,
  upstreamClient: Client,
  resourceUrl: string  // Full URL to this proxy endpoint including configId
): (req: Request) => Promise<Response> {
  // Cache upstream tools to avoid repeated fetches
  let upstreamToolsCache: any[] | null = null;

  async function getUpstreamTools() {
    if (!upstreamToolsCache) {
      console.error('[DIRECT-HANDLER] Fetching upstream tools...');
      const upstreamResponse = await upstreamClient.listTools();
      upstreamToolsCache = upstreamResponse.tools;
      console.error('[DIRECT-HANDLER] Cached upstream tools:', upstreamToolsCache.map(t => t.name));
    }
    return upstreamToolsCache;
  }

  return async (req: Request): Promise<Response> => {
    try {
      const body = await req.text();
      const jsonrpc = JSON.parse(body);

      console.error(`[DIRECT-HANDLER] Method: ${jsonrpc.method}`);

      let result: any;

      // Handle different MCP methods
      if (jsonrpc.method === 'initialize') {
        result = {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'direct-payment-proxy',
            version: '1.0.0'
          }
        };
      }
      else if (jsonrpc.method === 'notifications/initialized') {
        // Notification - just return success
        return new Response(JSON.stringify({
          jsonrpc: '2.0',
          id: jsonrpc.id,
          result: {}
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      else if (jsonrpc.method === 'tools/list') {
        // Get upstream tools with their full schemas (for fallback)
        const upstreamTools = await getUpstreamTools();

        // Build tools list by merging stored/upstream schemas with payment annotations
        const tools = config.tools
          .filter(t => t.enabled)
          .map(toolConfig => {
            let inputSchema;

            // Prefer stored schema, fall back to upstream
            if (toolConfig.input_schema) {
              console.error(`[DIRECT-HANDLER] Using stored inputSchema for ${toolConfig.name}`);
              inputSchema = toolConfig.input_schema;
            } else {
              // Find matching upstream tool
              const upstreamTool = upstreamTools.find(ut => ut.name === toolConfig.name);

              if (upstreamTool && upstreamTool.inputSchema) {
                console.error(`[DIRECT-HANDLER] Using upstream inputSchema for ${toolConfig.name}`);
                inputSchema = upstreamTool.inputSchema;
              } else {
                console.error(`[DIRECT-HANDLER] WARNING: No inputSchema found for ${toolConfig.name}, using empty schema`);
                inputSchema = {
                  type: "object",
                  properties: {},
                  additionalProperties: false,
                };
              }
            }

            // Build tool definition
            const tool: any = {
              name: toolConfig.name,
              description: toolConfig.description,
              inputSchema: inputSchema
            };

            // Add payment annotations for paid tools
            if (toolConfig.price > 0) {
              tool.annotations = {
                paymentHint: true,
                paymentPriceUSD: toolConfig.price,
                paymentNetworks: Object.keys(PAYMENT_NETWORKS).map(networkId =>
                  buildPaymentNetworkAnnotation(networkId, config.yourWallet, toolConfig.price)
                ),
                paymentVersion: 1
              };
            }

            return tool;
          });

        result = { tools };
      }
      else if (jsonrpc.method === 'tools/call') {
        const { name, arguments: args, _meta } = jsonrpc.params || {};

        const toolConfig = config.tools.find(t => t.name === name && t.enabled);

        if (!toolConfig) {
          result = {
            isError: true,
            content: [{ type: "text", text: `Tool not found: ${name}` }]
          };
        } else {
          // Check if payment is required
          if (toolConfig.price > 0) {
            const paymentToken = _meta?.["x402/payment"];

            if (!paymentToken) {
              // No payment - return 402 error with requirements
              console.error(`[DIRECT-HANDLER] ${name} - Payment required`);

              result = {
                isError: true,
                content: [{ type: "text", text: "Payment required" }],
                _meta: {
                  "x402/error": {
                    accepts: Object.keys(PAYMENT_NETWORKS).map(networkId =>
                      buildPaymentRequirement(
                        networkId,
                        config.yourWallet,
                        toolConfig.price,
                        name,
                        toolConfig.description,
                        resourceUrl  // Use the actual resource URL instead of upstreamUrl
                      )
                    )
                  }
                }
              };
            } else {
              // Payment provided - verify and settle
              console.error(`[DIRECT-HANDLER] ${name} - Payment token received`);

              try {
                // Step 1: Decode payment token
                console.error(`[DIRECT-HANDLER] ${name} - Decoding payment...`);
                let decodedPayment: any;

                try {
                  decodedPayment = decodePayment(paymentToken);
                  console.error(`[DIRECT-HANDLER] ${name} - Decoded payment on network:`, decodedPayment.network);
                } catch (decodeError: any) {
                  console.error(`[DIRECT-HANDLER] ${name} - ✗ Invalid payment token:`, decodeError.message);
                  result = {
                    isError: true,
                    content: [{ type: "text", text: `Invalid payment token: ${decodeError.message}` }]
                  };
                  throw new Error("PAYMENT_DECODE_FAILED");
                }

                // Step 2: Find matching payment requirement from original 402 error
                const paymentOptions = Object.keys(PAYMENT_NETWORKS).map(networkId =>
                  buildPaymentRequirement(
                    networkId,
                    config.yourWallet,
                    toolConfig.price,
                    name,
                    toolConfig.description,
                    resourceUrl  // Use the actual resource URL instead of upstreamUrl
                  )
                );

                const paymentRequirement = paymentOptions.find(opt => opt.network === decodedPayment.network);

                if (!paymentRequirement) {
                  console.error(`[DIRECT-HANDLER] ${name} - ✗ Unsupported network:`, decodedPayment.network);
                  result = {
                    isError: true,
                    content: [{ type: "text", text: `Unsupported payment network: ${decodedPayment.network}` }]
                  };
                  throw new Error("PAYMENT_NETWORK_UNSUPPORTED");
                }

                // Step 3: Verify payment signature via facilitator
                console.error(`[DIRECT-HANDLER] ${name} - Verifying payment...`);
                console.error(`[DIRECT-HANDLER] ${name} - Payment payload:`, JSON.stringify(decodedPayment, null, 2));
                console.error(`[DIRECT-HANDLER] ${name} - Payment requirement:`, JSON.stringify(paymentRequirement, null, 2));

                let verificationResult: any;
                try {
                  // Use node-fetch for facilitator call to avoid undici bug
                  verificationResult = await withNodeFetch(() => verify(
                    decodedPayment,
                    paymentRequirement as any
                  ));
                  console.error(`[DIRECT-HANDLER] ${name} - Verification response:`, JSON.stringify(verificationResult, null, 2));
                } catch (verifyError: any) {
                  console.error(`[DIRECT-HANDLER] ${name} - ✗ Verification error details:`);
                  console.error(`[DIRECT-HANDLER] ${name} -   Message:`, verifyError.message);
                  console.error(`[DIRECT-HANDLER] ${name} -   Stack:`, verifyError.stack);
                  console.error(`[DIRECT-HANDLER] ${name} -   Cause:`, verifyError.cause);
                  throw verifyError;
                }

                if (!verificationResult.isValid) {
                  console.error(`[DIRECT-HANDLER] ${name} - ✗ Payment verification failed:`, verificationResult.invalidReason);
                  result = {
                    isError: true,
                    content: [{
                      type: "text",
                      text: `Payment verification failed: ${verificationResult.invalidReason}`
                    }]
                  };
                  throw new Error("PAYMENT_VERIFICATION_FAILED");
                }

                console.error(`[DIRECT-HANDLER] ${name} - ✓ Payment verified from:`, verificationResult.payer);

                // Step 4: Settle payment on-chain via facilitator BEFORE calling upstream
                console.error(`[DIRECT-HANDLER] ${name} - Settling payment on-chain...`);
                
                let settlementResult: any;
                try {
                  // Use node-fetch for facilitator call to avoid undici bug
                  settlementResult = await withNodeFetch(() => settle(
                    decodedPayment,
                    paymentRequirement as any
                  ));

                  if (!settlementResult.success) {
                    console.error(`[DIRECT-HANDLER] ${name} - ✗ Settlement failed:`, settlementResult.errorReason);
                    result = {
                      isError: true,
                      content: [{
                        type: "text",
                        text: `Payment settlement failed: ${settlementResult.errorReason}`
                      }]
                    };
                    throw new Error("PAYMENT_SETTLEMENT_FAILED");
                  }

                  console.error(`[DIRECT-HANDLER] ${name} - ✓ Payment settled:`, settlementResult.transaction);

                } catch (settlementError: any) {
                  if (settlementError.message !== "PAYMENT_SETTLEMENT_FAILED") {
                    console.error(`[DIRECT-HANDLER] ${name} - ✗ Settlement exception:`, settlementError.message);
                    result = {
                      isError: true,
                      content: [{
                        type: "text",
                        text: `Payment settlement error: ${settlementError.message}`
                      }]
                    };
                    throw new Error("PAYMENT_SETTLEMENT_FAILED");
                  }
                  throw settlementError;
                }

                // Step 5: Call upstream tool ONLY after successful settlement
                console.error(`[DIRECT-HANDLER] ${name} - Calling upstream...`);
                result = await upstreamClient.callTool({
                  name,
                  arguments: args
                });
                console.error(`[DIRECT-HANDLER] ${name} - ✓ Upstream success`);

                // Add settlement metadata to result
                result._meta = {
                  ...(result._meta || {}),
                  "x402/settlement": {
                    success: true,
                    transaction: settlementResult.transaction,
                    network: settlementResult.network,
                    payer: settlementResult.payer
                  }
                };

              } catch (error: any) {
                // Only log if it's not our intentional control flow errors
                if (error.message !== "PAYMENT_DECODE_FAILED" &&
                    error.message !== "PAYMENT_VERIFICATION_FAILED" &&
                    error.message !== "PAYMENT_NETWORK_UNSUPPORTED" &&
                    error.message !== "PAYMENT_SETTLEMENT_FAILED") {
                  console.error(`[DIRECT-HANDLER] ${name} - ✗ Unexpected error:`, error.message);
                  result = {
                    isError: true,
                    content: [{ type: "text", text: `Payment processing error: ${error.message}` }]
                  };
                }
              }
            }
          } else {
            // Free tool - call upstream directly
            console.error(`[DIRECT-HANDLER] ${name} - FREE tool`);
            try {
              result = await upstreamClient.callTool({
                name,
                arguments: args
              });
              console.error(`[DIRECT-HANDLER] ${name} - ✓ Success`);
            } catch (error: any) {
              console.error(`[DIRECT-HANDLER] ${name} - ✗ Error:`, error.message);
              result = {
                isError: true,
                content: [{ type: "text", text: `Upstream error: ${error.message}` }]
              };
            }
          }
        }
      }
      else {
        throw new Error(`Unknown method: ${jsonrpc.method}`);
      }

      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        id: jsonrpc.id,
        result
      }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error: any) {
      console.error('[DIRECT-HANDLER] Error:', error.message);
      return new Response(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32000,
          message: error.message
        }
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };
}
