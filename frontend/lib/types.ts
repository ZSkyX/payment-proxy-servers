export interface ToolConfig {
  name: string;
  description: string;
  price: number;
  enabled: boolean;
}

export interface ServerConfig {
  upstreamUrl: string;
  yourWallet: string;
  tools: ToolConfig[];
}

export interface FetchedTool {
  name: string;
  description: string;
  inputSchema?: any;
}
