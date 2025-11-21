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

export class FluxaMcp implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'FluxA MCP',
		name: 'fluxaMcp',
		icon: 'file:../fluxa_logo.png',
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
				message: 'Visit the <a href="https://fluxa-serve.up.railway.app/auth-setup" target="_blank">FluxA Setup Page</a> to register and authorize your agent before using this node.',
				type: 'info',
				location: 'ndv',
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
				displayName: "Please setup if you haven't. Link in the Output Pannel",
				name: 'setupNotice',
				type: 'notice',
				default: '',

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
				const agentJwt = credentials.agentJwt as string;

				try {

					// Create MCP client
					const client = new Client(
						{ name: 'n8n-fluxa-mcp', version: '1.0.0' },
						{ capabilities: {} }
					);

					const transport = new StreamableHTTPClientTransport(new URL(serverUrl));
					await client.connect(transport);

					// Wrap with payment client
					const defaultNetwork = credentials.defaultNetwork as string || 'base';

					const paymentClient = createPaymentClient(client, {
						fluxaWalletServiceUrl: 'https://walletapi.fluxapay.xyz',
						agentJwt,
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

	async supplyData(this: ISupplyDataFunctions, itemIndex: number): Promise<SupplyData> {
		// Get credentials
		const credentials = await this.getCredentials('fluxaApi');
		const agentJwt = credentials.agentJwt as string;
		const defaultNetwork = credentials.defaultNetwork as string;

		// Get parameters
		const serverUrl = this.getNodeParameter('serverUrl', itemIndex) as string;
		const toolsToExpose = this.getNodeParameter('toolsToExpose', itemIndex, []) as string[];
		const options = this.getNodeParameter('options', itemIndex, {}) as any;
		const network = options.network || defaultNetwork || 'base';

		// Create MCP client
		const client = new Client(
			{ name: 'n8n-fluxa-mcp', version: '1.0.0' },
			{ capabilities: {} }
		);

		const transport = new StreamableHTTPClientTransport(new URL(serverUrl));
		await client.connect(transport);

		// Wrap with payment client
		const paymentClient = createPaymentClient(client, {
			fluxaWalletServiceUrl: 'https://walletapi.fluxapay.xyz',
			agentJwt,
			network,
			logger: (msg) => console.log(`[FluxaMcp] ${msg}`),
		});

		// List available tools
		const result = await paymentClient.listTools();

		// Filter tools based on user selection
		const exposedTools = toolsToExpose.length > 0
			? result.tools.filter((tool: any) => toolsToExpose.includes(tool.name))
			: result.tools;

		console.log(`[FluxaMcp] Supplying ${exposedTools.length} tools to AI agent`);

		// Convert MCP tools to LangChain DynamicStructuredTool
		const tools = exposedTools.map((tool: any) => {
			// Use generic schema that accepts any arguments
			const schema = z.object({}).passthrough();

			return new DynamicStructuredTool({
				name: tool.name,
				description: tool.description || '',
				schema: schema as any,
				func: async (input: any) => {
					console.log(`[FluxaMcp] AI agent calling tool: ${tool.name}`);
					console.log(`[FluxaMcp] Tool arguments:`, JSON.stringify(input, null, 2));

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
							isError: result.isError as boolean,
							settlement: result._meta?.['x402/settlement'] as any,
							timestamp: new Date().toISOString(),
						},
					};

					try {
						await this.addOutputData(NodeConnectionTypes.AiTool, itemIndex, [[outputData]]);
					} catch (error) {
						console.error('[FluxaMcp] Failed to add output data:', error);
					}

					if (result.isError) {
						// Return error message with URLs visible to user
						console.log(`[FluxaMcp] Tool ${tool.name} returned error:`, result);
						return `⚠️ ERROR:\n\n${textContent}`;
					}

					console.log(`[FluxaMcp] Tool ${tool.name} completed successfully`);
					return textContent;
				},
			});
		});

		return {
			response: tools,
		};
	}

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		// This node works via supplyData() for AI tool connections
		// Execute method is not used - users should complete setup via the web page
		return [[]];
	}
}
