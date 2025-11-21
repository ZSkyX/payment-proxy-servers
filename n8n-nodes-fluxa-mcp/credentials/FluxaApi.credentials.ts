import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class FluxaApi implements ICredentialType {
	name = 'fluxaApi';
	displayName = 'FluxA API';
	properties: INodeProperties[] = [
		{
			displayName: 'Visit the <a href="https://fluxa-serve.up.railway.app/auth-setup" target="_blank">FluxA Setup Page</a> to register and authorize your agent before using this credential.',
			name: 'setupNotice',
			type: 'notice',
			default: '',
		},
		{
			displayName: 'Agent JWT Token',
			name: 'agentJwt',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			placeholder: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
			description: 'Your FluxA agent JWT token from the setup page',
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
}
