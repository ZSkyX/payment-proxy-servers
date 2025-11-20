import {
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class FluxaApi implements ICredentialType {
	name = 'fluxaApi';
	displayName = 'FluxA API';
	properties: INodeProperties[] = [
		{
			displayName: 'Email',
			name: 'email',
			type: 'string',
			default: '',
			required: true,
			placeholder: 'your@email.com',
			description: 'Your email address for FluxA agent registration',
		},
		{
			displayName: 'Agent Name',
			name: 'agentName',
			type: 'string',
			default: 'n8n - My Instance',
			required: true,
			placeholder: 'n8n - Production',
			description: 'A unique name for this n8n instance (e.g., "n8n - Production", "n8n - Development")',
		},
		{
			displayName: 'FluxA Wallet Service URL',
			name: 'walletServiceUrl',
			type: 'string',
			default: 'https://walletapi.fluxapay.xyz',
			required: true,
			description: 'FluxA Wallet Service endpoint URL',
		},
		{
			displayName: 'Payment Network',
			name: 'defaultNetwork',
			type: 'options',
			options: [
				{
					name: 'Base',
					value: 'base',
				},
				{
					name: 'Base Sepolia (Testnet)',
					value: 'base-sepolia',
				},
				{
					name: 'Avalanche',
					value: 'avalanche',
				},
				{
					name: 'Avalanche Fuji (Testnet)',
					value: 'avalanche-fuji',
				},
				{
					name: 'Solana',
					value: 'solana',
				},
				{
					name: 'Solana Devnet (Testnet)',
					value: 'solana-devnet',
				},
			],
			default: 'base',
			description: 'Default blockchain network for payments',
		},
	];

	// Test the credential
	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.walletServiceUrl}}',
			url: '/health',
			method: 'GET',
		},
	};
}
