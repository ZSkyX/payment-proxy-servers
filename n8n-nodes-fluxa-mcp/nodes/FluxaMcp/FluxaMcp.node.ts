import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	ISupplyDataFunctions,
	SupplyData,
	NodeConnectionTypes,
} from 'n8n-workflow';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createPaymentClient } from './payment-client';

// Type for agent registration response
interface AgentRegistrationResponse {
	jwt: string;
	agent_id: string;
	message?: string;
}

// Cache for agent JWTs (keyed by email+agentName)
const agentJwtCache = new Map<string, { jwt: string; agentId: string; timestamp: number }>();
const JWT_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Helper function to register agent with FluxA
async function registerAgent(
	email: string,
	agentName: string
): Promise<{ jwt: string; agentId: string }> {
	const cacheKey = `${email}:${agentName}`;

	// Check cache
	const cached = agentJwtCache.get(cacheKey);
	if (cached && Date.now() - cached.timestamp < JWT_CACHE_TTL) {
		return { jwt: cached.jwt, agentId: cached.agentId };
	}

	try {
		const response = await fetch('https://agentid.fluxapay.xyz/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email,
				agent_name: agentName,
				client_info: 'n8n FluxA MCP Node',
			}),
		});

		const data = await response.json() as AgentRegistrationResponse;

		if (!response.ok) {
			throw new Error(`Agent registration failed: ${data.message || 'Unknown error'}`);
		}

		// Cache the JWT
		agentJwtCache.set(cacheKey, {
			jwt: data.jwt,
			agentId: data.agent_id,
			timestamp: Date.now(),
		});

		return { jwt: data.jwt, agentId: data.agent_id };
	} catch (error: any) {
		throw new Error(`Failed to register agent: ${error.message}`);
	}
}

export class FluxaMcp implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FluxA MCP',
		name: 'fluxaMcp',
		icon: 'file:fluxa_logo.png',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["serverUrl"]}}',
		description: 'Expose MCP server tools to AI agents with automatic X402 payment handling via FluxA',
		defaults: {
			name: 'FluxA MCP',
		},
		inputs: [],
		outputs: [NodeConnectionTypes.AiTool],
		outputNames: ['Tools', 'Execution Logs'],
		hints: [
			{
				message: 'Visit the <a href="https://fluxa-servers-connection.up.railway.app/auth-setup" target="_blank">FluxA Setup Page</a> to register and authorize your agent before using this node.',
				type: 'info',
				location: 'outputPane',
				whenToDisplay: 'always'
			},
		],
		codex: {
			categories: ['AI'],
			subcategories: {
				AI: ['Tools'],
			},
			resources: {
				primaryDocumentation: [
					{
						url: 'https://github.com/FluxA-Agent-Payment/payment-proxy-servers',
					},
				],
			},
		},
		credentials: [
			{
				name: 'fluxaApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'MCP Server URL',
				name: 'serverUrl',
				type: 'string',
				default: '',
				placeholder: 'https://fluxa-servers-connection.up.railway.app/mcp/your-config-id',
				required: true,
				description: 'The HTTP endpoint of the MCP server (e.g., FluxA proxy URL)',
			},
			{
				displayName: 'Tools to Expose',
				name: 'toolsToExpose',
				type: 'multiOptions',
				typeOptions: {
					loadOptionsMethod: 'getTools',
				},
				default: [],
				description: 'Select which tools to expose (leave empty to expose all tools)',
				hint: 'When empty, all available tools from the MCP server will be exposed',
			},
			{
				displayName: "First Time Setup Required",
				name: 'setupNotice',
				type: 'notice',
				default: '',
					

			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Show Detailed Setup',
						name: 'showDetailedSetup',
						type: 'boolean',
						default: false,
						description: 'Whether to fetch and show detailed setup information including pre-approval URLs and tool pricing when executing this node. Enable this when you need to set up pre-approvals.',
					},
					{
						displayName: 'Override Network',
						name: 'network',
						type: 'options',
						options: [
							{ name: 'Use Default from Credential', value: '' },
							{ name: 'Base', value: 'base' },
							{ name: 'Base Sepolia', value: 'base-sepolia' },
							{ name: 'Avalanche', value: 'avalanche' },
							{ name: 'Avalanche Fuji', value: 'avalanche-fuji' },
							{ name: 'Solana', value: 'solana' },
							{ name: 'Solana Devnet', value: 'solana-devnet' },
						],
						default: '',
						description: 'Override the default payment network from credentials',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getTools(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const serverUrl = this.getCurrentNodeParameter('serverUrl') as string;
				const credentials = await this.getCredentials('fluxaApi');
				const email = credentials.email as string;
				const agentName = credentials.agentName as string;

				try {
					// Register agent and get JWT
					const { jwt: agentJwt } = await registerAgent(email, agentName);

					// Create MCP client
					const client = new Client(
						{ name: 'n8n-fluxa-mcp', version: '1.0.0' },
						{ capabilities: {} }
					);

					const transport = new StreamableHTTPClientTransport(new URL(serverUrl));
					await client.connect(transport);

					// Wrap with payment client
					const walletServiceUrl = credentials.walletServiceUrl as string;
					const defaultNetwork = credentials.defaultNetwork as string || 'base';

					const paymentClient = createPaymentClient(client, {
						fluxaWalletServiceUrl: walletServiceUrl,
						agentJwt,
						agentName,
						network: defaultNetwork,
						confirmationCallback: async () => true,
					});

					// List tools
					const result = await paymentClient.listTools();

					// Convert to options format
					return result.tools.map((tool: any) => ({
						name: tool.name,
						value: tool.name,
						description: tool.description || '',
					}));
				} catch (error: any) {
					return [];
				}
			},
		},
	};

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		// Get credentials
		const credentials = await this.getCredentials('fluxaApi');
		const email = credentials.email as string;
		const agentName = credentials.agentName as string;
		const walletServiceUrl = credentials.walletServiceUrl as string;
		const defaultNetwork = credentials.defaultNetwork as string;

		// Get parameters
		const serverUrl = this.getNodeParameter('serverUrl', itemIndex) as string;
		const toolsToExpose = this.getNodeParameter('toolsToExpose', itemIndex, []) as string[];
		const options = this.getNodeParameter('options', itemIndex, {}) as any;
		const network = options.network || defaultNetwork || 'base';

		// Register agent and get JWT
		const { jwt: agentJwt, agentId } = await registerAgent(email, agentName);

		// Create MCP client
		const client = new Client(
			{ name: 'n8n-fluxa-mcp', version: '1.0.0' },
			{ capabilities: {} }
		);

		const transport = new StreamableHTTPClientTransport(new URL(serverUrl));
		await client.connect(transport);

		// Wrap with payment client
		const paymentClient = createPaymentClient(client, {
			fluxaWalletServiceUrl: walletServiceUrl,
			agentJwt,
			agentName,
			network,
		});

		// List available tools
		const result = await paymentClient.listTools();

		// Filter tools based on user selection
		const exposedTools = toolsToExpose.length > 0
			? result.tools.filter((tool: any) => toolsToExpose.includes(tool.name))
			: result.tools;

		// Convert MCP tools to LangChain DynamicStructuredTool
		const tools = exposedTools.map((tool: any) => {
			// Use generic schema that accepts any arguments
			const schema = z.object({}).passthrough();

			return new DynamicStructuredTool({
				name: tool.name,
				description: tool.description || '',
				schema: schema as any,
				func: async (input: any) => {
					const result = await paymentClient.callTool({
						name: tool.name,
						arguments: input,
					});

					// Extract text content (works for both success and error)
					const textContent = (result.content as any[])
						?.filter((c: any) => c.type === 'text')
						.map((c: any) => c.text)
						.join('\n') || '';

					// Add output data to make it visible in n8n UI
					const outputData: INodeExecutionData = {
						json: {
							tool: tool.name,
							arguments: input,
							result: textContent,
							fullResult: result,
							isError: result.isError,
							settlement: result._meta?.['x402/settlement'],
							timestamp: new Date().toISOString(),
						},
					};

					try {
						await this.addOutputData(NodeConnectionTypes.AiTool, itemIndex, outputData);
					} catch (error) {
						// Silently fail if output data cannot be added
					}

					if (result.isError) {
						return `ERROR:\n\n${textContent}`;
					}

					return textContent;
				},
			});
		});

		return {
			response: tools,
		};
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const returnData: INodeExecutionData[] = [];

		try {
			// Get credentials
			const credentials = await this.getCredentials('fluxaApi');
			const email = credentials.email as string;
			const agentName = credentials.agentName as string;
			const walletServiceUrl = credentials.walletServiceUrl as string;
			const defaultNetwork = credentials.defaultNetwork as string;

			// Get parameters
			const serverUrl = this.getNodeParameter('serverUrl', 0) as string;
			const toolsToExpose = this.getNodeParameter('toolsToExpose', 0, []) as string[];
			const options = this.getNodeParameter('options', 0, {}) as any;
			const network = options.network || defaultNetwork || 'base';

			// Get toggle option
			const showDetailedSetup = options.showDetailedSetup || false;

			// Register agent and get JWT (with caching)
			const { jwt: agentJwt, agentId } = await registerAgent(email, agentName);

			// Create MCP client (used by both modes)
			const client = new Client(
				{ name: 'n8n-fluxa-mcp', version: '1.0.0' },
				{ capabilities: {} }
			);

			const transport = new StreamableHTTPClientTransport(new URL(serverUrl));
			await client.connect(transport);

			// Wrap with payment client
			const paymentClient = createPaymentClient(client, {
				fluxaWalletServiceUrl: walletServiceUrl,
				agentJwt,
				agentName,
				network,
			});

			// If detailed setup is requested, fetch tools and show detailed info
			if (showDetailedSetup) {
				// Construct URLs
				const encodedName = encodeURIComponent(agentName);
				const authUrl = `https://agentwallet.fluxapay.xyz/add-agent?agentId=${agentId}&name=${encodedName}`;
				const walletUrl = `https://agentwallet.fluxapay.xyz`;

				// List available tools from the MCP server
				const result = await paymentClient.listTools();

				// Filter tools based on user selection
				const exposedTools = toolsToExpose.length > 0
					? result.tools.filter((tool: any) => toolsToExpose.includes(tool.name))
					: result.tools;

				// Calculate pre-approval parameters from tool annotations
				let maxAmount = 0;
				let payToAddress = '';

				for (const tool of exposedTools) {
					const annotations = tool.annotations as any;
					if (annotations?.paymentNetworks) {
						// Find the payment network matching the selected network
						const paymentNetwork = annotations.paymentNetworks.find(
							(pn: any) => pn.network === network
						);

						if (paymentNetwork) {
							// Track the maximum amount required across all tools
							const toolAmount = parseInt(paymentNetwork.maxAmountRequired || '0');
							if (toolAmount > maxAmount) {
								maxAmount = toolAmount;
								payToAddress = paymentNetwork.recipient;
							}
						}
					}
				}

				// Construct pre-approval URL if we have payment info
				const encodedResourceUrl = encodeURIComponent(serverUrl);
				let preApprovalUrl = '';
				if (maxAmount > 0 && payToAddress) {
					preApprovalUrl = `https://agentwallet.fluxapay.xyz/authorize-payment?agentId=${agentId}&resourceUrl=${encodedResourceUrl}&amount=${maxAmount}&payTo=${payToAddress}`;
				}

				// Return the list of tools that will be exposed
				returnData.push({
					json: {
						message: 'FluxA MCP Node configured successfully',
						setup: {
							step1_authorizeAgent: {
								url: authUrl,
								instructions: 'Open this URL to authorize your agent in FluxA Wallet (first time only)',
							},
							step2_preApprovePayments: preApprovalUrl ? {
								url: preApprovalUrl,
								instructions: `Pre-approve payments up to ${(maxAmount / 1_000_000).toFixed(6)} USDC for all tools in this configuration`,
								maxAmount: maxAmount,
								payTo: payToAddress,
								network: network,
							} : undefined,
							step3_managePayments: {
								url: walletUrl,
								instructions: 'Open this URL to view and manage all payments',
							},
						},
					},
				});
			}
		} catch (error: any) {
			if (this.continueOnFail()) {
				returnData.push({
					json: {
						error: error.message,
					},
				});
			} else {
				throw error;
			}
		}

		return [returnData];
	}
}
