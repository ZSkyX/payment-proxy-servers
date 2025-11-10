/**
 * Custom X402 Payment Client Wrapper
 * Replaces withX402Client from mcpay with our own implementation
 */

import type { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { createPaymentHeader } from 'x402/client';
import type { EvmSignerWallet } from 'x402/types';

interface PaymentOption {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  payTo: string;
  asset: string;
  maxTimeoutSeconds: number;
  resource: string;
  mimeType: string;
  description: string;
  extra?: any;
}

interface PaymentClientConfig {
  signer: EvmSignerWallet;
  network: string;
  confirmationCallback?: (options: PaymentOption[]) => Promise<boolean>;
}

export function createPaymentClient(
  client: Client,
  config: PaymentClientConfig
) {
  const { signer, network, confirmationCallback } = config;

  // Store the original callTool method
  const originalCallTool = client.callTool.bind(client);

  // Override callTool with payment logic
  client.callTool = async (params: any, resultSchema?: any, options?: any) => {
    console.error('[CUSTOM-PAYMENT-CLIENT] Calling tool:', params.name);

    // First attempt - call without payment
    let result = await originalCallTool(params, resultSchema, options);

    // Check if payment is required
    const paymentError = result._meta?.['x402/error'];
    if (result.isError && paymentError?.accepts) {
      console.error('[CUSTOM-PAYMENT-CLIENT] Payment required');

      const paymentOptions: PaymentOption[] = paymentError.accepts;

      // Show payment options to user (if callback provided)
      if (confirmationCallback) {
        const approved = await confirmationCallback(paymentOptions);
        if (!approved) {
          console.error('[CUSTOM-PAYMENT-CLIENT] Payment declined by user');
          return {
            isError: true,
            content: [{ type: 'text', text: 'Payment declined' }]
          };
        }
      }

      // Find payment option for our network
      const selectedOption = paymentOptions.find(opt => opt.network === network);

      if (!selectedOption) {
        console.error(`[CUSTOM-PAYMENT-CLIENT] No payment option for network: ${network}`);
        return {
          isError: true,
          content: [{ type: 'text', text: `Payment network ${network} not supported` }]
        };
      }

      console.error('[CUSTOM-PAYMENT-CLIENT] Creating payment token...');

      // Create payment requirement object for x402/client
      const paymentRequirement = {
        scheme: selectedOption.scheme as "exact",
        network: selectedOption.network as any,
        maxAmountRequired: selectedOption.maxAmountRequired,
        payTo: selectedOption.payTo as `0x${string}`,
        asset: selectedOption.asset as `0x${string}`,
        maxTimeoutSeconds: selectedOption.maxTimeoutSeconds,
        resource: selectedOption.resource as any,
        mimeType: selectedOption.mimeType,
        description: selectedOption.description,
        extra: selectedOption.extra
      };

      // Create payment token using x402/client
      const paymentToken = await createPaymentHeader(
        signer,
        1, // version
        paymentRequirement
      );

      console.error('[CUSTOM-PAYMENT-CLIENT] Payment token created, retrying with payment...');

      // Retry with payment token
      result = await originalCallTool({
        ...params,
        _meta: {
          ...(params._meta || {}),
          'x402/payment': paymentToken
        }
      }, resultSchema, options);

      console.error('[CUSTOM-PAYMENT-CLIENT] Tool call with payment completed');
    }

    return result;
  };

  return client;
}
