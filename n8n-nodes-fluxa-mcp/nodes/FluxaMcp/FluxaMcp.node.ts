import {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
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
		console.log('[FluxaMcp] Using cached agent JWT');
		return { jwt: cached.jwt, agentId: cached.agentId };
	}

	console.log('[FluxaMcp] Registering agent with FluxA...');

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

		console.log('[FluxaMcp] Agent registered successfully:', data.agent_id);

		// Construct authorization URL
		const encodedName = encodeURIComponent(agentName);
		const authUrl = `https://agentwallet.fluxapay.xyz/add-agent?agentId=${data.agent_id}&name=${encodedName}`;
		console.log('[FluxaMcp] ⚠️  IMPORTANT: Authorize your agent at:', authUrl);

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
		inputs: ['main'],
		outputs: ['main'],
		usableAsTool: true,
		credentials: [
			{
				name: 'fluxaApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: "First Time Setup Required if you have't registered your agent",
				name: 'setupNotice',
				type: 'notice',
				default: '',
			},
			{
				displayName: 'Click `Execution Step` button to setup your agent',
				name: 'registrationInfo',
				type: 'notice',
				default: '',
				description: 'Your agent will be automatically registered with FluxA when you first use this node. After registration, you need to authorize the agent in FluxA Wallet to approve payments.',
			},
			{
				displayName: 'Authorize Agent',
				name: 'authorizeInfo',
				type: 'notice',
				default: '',
				description: 'After first use, you will receive an agent ID. Visit https://agentwallet.fluxapay.xyz to authorize your agent and manage payments. Your credentials (email and agent name) will be used for registration.',
			},
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
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
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
						logger: (msg) => console.log(`[FluxaMcp] ${msg}`),
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
					console.error('[FluxaMcp] Error loading tools:', error);
					return [];
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				// Get credentials
				const credentials = await this.getCredentials('fluxaApi', i);
				const email = credentials.email as string;
				const agentName = credentials.agentName as string;
				const walletServiceUrl = credentials.walletServiceUrl as string;
				const defaultNetwork = credentials.defaultNetwork as string;

				// Get parameters
				const serverUrl = this.getNodeParameter('serverUrl', i) as string;
				const toolsToExpose = this.getNodeParameter('toolsToExpose', i, []) as string[];
				const options = this.getNodeParameter('options', i, {}) as any;
				const network = options.network || defaultNetwork || 'base';

				// Register agent and get JWT (with caching)
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
					logger: (msg) => console.log(`[FluxaMcp] ${msg}`),
				});

				// List available tools from the MCP server
				const result = await paymentClient.listTools();

				// Filter tools based on user selection
				const exposedTools = toolsToExpose.length > 0
					? result.tools.filter((tool: any) => toolsToExpose.includes(tool.name))
					: result.tools;

				// Construct URLs for the user
				const encodedName = encodeURIComponent(agentName);
				const authUrl = `https://agentwallet.fluxapay.xyz/add-agent?agentId=${agentId}&name=${encodedName}`;
				const walletUrl = `https://agentwallet.fluxapay.xyz`;

				// Return the list of tools that will be exposed
				returnData.push({
					json: {
						message: 'FluxA MCP Node configured successfully',
						setup: {
							step1_authorizeAgent: {
								url: authUrl,
								instructions: 'Open this URL to authorize your agent in FluxA Wallet (first time only)',
							},
							step2_managePayments: {
								url: walletUrl,
								instructions: 'Open this URL to view and approve pending payments',
							},
						},
						serverUrl,
						toolsConfigured: toolsToExpose.length > 0 ? toolsToExpose : 'all',
						availableTools: exposedTools.map((tool: any) => ({
							name: tool.name,
							description: tool.description,
						})),
						_meta: {
							serverUrl,
							agentId,
							network,
							totalTools: exposedTools.length,
						},
					},
				});
			} catch (error: any) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error.message,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
