const path = require('path');
const glob = require('glob');

// Find all .node.ts files
const nodeEntries = glob.sync('./nodes/**/*.node.ts').reduce((entries, file) => {
	const name = path.relative('./nodes', file).replace(/\.ts$/, '');
	entries[name] = file;
	return entries;
}, {});

// Find all .credentials.ts files
const credentialEntries = glob.sync('./credentials/**/*.credentials.ts').reduce((entries, file) => {
	const name = path.relative('./credentials', file).replace(/\.ts$/, '');
	entries[name] = file;
	return entries;
}, {});

module.exports = {
	mode: 'production',
	entry: {
		...nodeEntries,
		...credentialEntries,
	},
	target: 'node',
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: '[name].js',
		libraryTarget: 'commonjs2',
	},
	resolve: {
		extensions: ['.ts', '.js'],
	},
	module: {
		rules: [
			{
				test: /\.ts$/,
				use: 'ts-loader',
				exclude: /node_modules/,
			},
		],
	},
	externals: {
		// Don't bundle n8n-workflow as it's a peer dependency
		'n8n-workflow': 'commonjs n8n-workflow',
	},
	optimization: {
		minimize: false, // Keep code readable for debugging
	},
};
