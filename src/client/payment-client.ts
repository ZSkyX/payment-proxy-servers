/**
 * Custom X402 Payment Client Wrapper
 * Uses FluxA Wallet Service for payment signing
 */

import type { Client } from '@modelcontextprotocol/sdk/client/index.js';

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
  fluxaWalletServiceUrl: string;
  agentJwt: string;
  network: string;
  confirmationCallback?: (options: PaymentOption[]) => Promise<boolean>;
}

export function createPaymentClient(
  client: Client,
  config: PaymentClientConfig
) {
  const { fluxaWalletServiceUrl, agentJwt, network, confirmationCallback } = config;

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

      console.error('[CUSTOM-PAYMENT-CLIENT] Creating payment via FluxA Wallet Service...');

      // Extract host from resource URL
      let host: string;
      try {
        const resourceUrl = new URL(selectedOption.resource);
        host = resourceUrl.hostname;
      } catch {
        // If resource is not a full URL, try to extract from scheme
        host = selectedOption.resource.replace('mcp://', '').split('/')[0];
      }

      // Call FluxA Wallet Service to create payment
      let paymentResponse;
      try {
        const response = await fetch(`${fluxaWalletServiceUrl}/api/payment/x402V1Payment`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${agentJwt}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            scheme: selectedOption.scheme,
            network: selectedOption.network,
            amount: selectedOption.maxAmountRequired,
            currency: 'USDC',
            assetAddress: selectedOption.asset,
            payTo: selectedOption.payTo,
            host: host,
            resource: selectedOption.resource,
            description: selectedOption.description,
            tokenName: selectedOption.extra?.name || 'USDC',
            tokenVersion: selectedOption.extra?.version || '2',
            validityWindowSeconds: selectedOption.maxTimeoutSeconds || 60
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`FluxA Wallet Service error: ${errorData.message || response.statusText}`);
        }

        paymentResponse = await response.json();
      } catch (error: any) {
        console.error('[CUSTOM-PAYMENT-CLIENT] FluxA Wallet Service error:', error.message);
        return {
          isError: true,
          content: [{ type: 'text', text: `Payment creation failed: ${error.message}` }]
        };
      }

      // Check if payment needs user approval
      if (paymentResponse.status === 'need_approval') {
        console.error('[CUSTOM-PAYMENT-CLIENT] Payment requires user approval:', paymentResponse.approvalUrl);
        return {
          isError: true,
          content: [{
            type: 'text',
            text: `Payment requires approval. Please visit: ${paymentResponse.approvalUrl}\nThen retry this operation.`
          }]
        };
      }

      // Encode payment as base64
      const paymentToken = Buffer.from(JSON.stringify(paymentResponse.xPayment || paymentResponse)).toString('base64');

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
