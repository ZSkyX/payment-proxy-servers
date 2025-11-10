import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { upstreamUrl } = await request.json();

    if (!upstreamUrl) {
      return NextResponse.json(
        { error: "Upstream URL is required" },
        { status: 400 }
      );
    }

    // Create MCP client
    const client = new Client(
      { name: "config-tool", version: "1.0.0" },
      { capabilities: {} }
    );

    const transport = new StreamableHTTPClientTransport(new URL(upstreamUrl));
    await client.connect(transport);

    // Fetch tools
    const toolsResponse = await client.listTools();
    await client.close();

    return NextResponse.json({
      success: true,
      tools: toolsResponse.tools.map((tool: any) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    });
  } catch (error: any) {
    console.error("Error connecting to upstream:", error);
    return NextResponse.json(
      { error: error.message || "Failed to connect to upstream server" },
      { status: 500 }
    );
  }
}
