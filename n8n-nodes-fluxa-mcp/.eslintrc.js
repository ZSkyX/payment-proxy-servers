module.exports = {
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
	},
	extends: ['plugin:n8n-nodes-base/community'],
	rules: {
		'@typescript-eslint/no-explicit-any': 'off',
	},
};
