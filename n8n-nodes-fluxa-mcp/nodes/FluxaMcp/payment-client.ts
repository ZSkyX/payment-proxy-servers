/**
 * Custom X402 Payment Client Wrapper for n8n
 * Adapted from cli-ts/payment-client.ts
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import axios from 'axios';

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
  agentName: string;
  network: string;
  confirmationCallback?: (options: PaymentOption[]) => Promise<boolean>;
  logger?: (message: string) => void;
}

interface X402Error {
  accepts: PaymentOption[];
  error?: string;
  x402Version?: number;
}

export function createPaymentClient(
  client: Client,
  config: PaymentClientConfig
) {
  const { fluxaWalletServiceUrl, agentJwt, agentName, network, confirmationCallback, logger } = config;

  const log = logger || (() => {});

  // Store the original callTool method
  const originalCallTool = client.callTool.bind(client);

  // Override callTool with payment logic
  client.callTool = async (params: any, resultSchema?: any, options?: any) => {
    log(`[PAYMENT-CLIENT] Calling tool: ${params.name}`);

    // First attempt - call without payment
    let result = await originalCallTool(params, resultSchema, options);

    // Check if payment is required
    const paymentError = result._meta?.['x402/error'] as X402Error | undefined;
    if (result.isError && paymentError?.accepts) {
      log('[PAYMENT-CLIENT] Payment required');

      const paymentOptions: PaymentOption[] = paymentError.accepts;

      // Show payment options to user (if callback provided)
      if (confirmationCallback) {
        const approved = await confirmationCallback(paymentOptions);
        if (!approved) {
          log('[PAYMENT-CLIENT] Payment declined by user');
          return {
            isError: true,
            content: [{ type: 'text', text: 'Payment declined' }]
          };
        }
      }

      // Find payment option for our network
      const selectedOption = paymentOptions.find(opt => opt.network === network);

      if (!selectedOption) {
        log(`[PAYMENT-CLIENT] No payment option for network: ${network}`);
        return {
          isError: true,
          content: [{ type: 'text', text: `Payment network ${network} not supported` }]
        };
      }

      log('[PAYMENT-CLIENT] Creating payment via FluxA Wallet Service...');

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
        const requestData = {
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
        };

        // Sanitize URL - ensure no double slashes
        const baseUrl = fluxaWalletServiceUrl.endsWith('/')
          ? fluxaWalletServiceUrl.slice(0, -1)
          : fluxaWalletServiceUrl;
        const paymentUrl = `${baseUrl}/api/payment/x402V1Payment`;

        log(`[PAYMENT-CLIENT] Request URL: ${paymentUrl}`);

        const response = await axios.post(paymentUrl, requestData, {
          headers: {
            'Authorization': `Bearer ${agentJwt}`,
            'Content-Type': 'application/json'
          }
        });

        paymentResponse = response.data;
        log(`[PAYMENT-CLIENT] Payment response status: ${paymentResponse.status}`);
      } catch (error: any) {
        log(`[PAYMENT-CLIENT] FluxA Wallet Service error: ${error.message}`);
        if (error.response) {
          const errorData = error.response.data;

          // If there's a payment_model_context with agent_not_found, build authorization link
          if (errorData.payment_model_context && errorData.code === 'agent_not_found') {
            const instructions = errorData.payment_model_context.instructions || '';

            // Extract agent_id from instructions
            const agentIdMatch = instructions.match(/ID:\s*([a-f0-9-]+)/i);
            const agentId = agentIdMatch ? agentIdMatch[1] : '';

            let message = `Payment failed: ${errorData.message || error.message}\n\n`;

            if (agentId) {
              const encodedName = encodeURIComponent(agentName);
              const authUrl = `https://agentwallet.fluxapay.xyz/add-agent?agentId=${agentId}&name=${encodedName}`;
              message += `Your agent needs to be authorized in FluxA wallet.\n\n`;
              message += `Please open this link to authorize:\n${authUrl}\n\n`;
              message += `After authorization, please retry this request.`;
            } else {
              message += instructions;
            }

            return {
              isError: true,
              content: [{
                type: 'text',
                text: message
              }]
            };
          }

          // For other payment_model_context errors, pass through instructions
          if (errorData.payment_model_context) {
            const instructions = errorData.payment_model_context.instructions || '';
            return {
              isError: true,
              content: [{
                type: 'text',
                text: `Payment failed: ${errorData.message || error.message}\n\n${instructions}`
              }]
            };
          }
        }

        return {
          isError: true,
          content: [{ type: 'text', text: `Payment creation failed: ${error.message}` }]
        };
      }

      // Check if payment needs user approval
      if (paymentResponse.status === 'need_approval') {
        log(`[PAYMENT-CLIENT] Payment requires user approval: ${paymentResponse.approvalUrl}`);
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

      log('[PAYMENT-CLIENT] Payment token created, retrying with payment...');

      // Retry with payment token
      result = await originalCallTool({
        ...params,
        _meta: {
          ...(params._meta || {}),
          'x402/payment': paymentToken
        }
      }, resultSchema, options);

      log('[PAYMENT-CLIENT] Tool call with payment completed');
    }

    return result;
  };

  return client;
}
