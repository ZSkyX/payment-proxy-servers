import { NextRequest, NextResponse } from "next/server";
import { db } from "@/shared/database";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();

    // Validate config
    if (!config.upstreamUrl || !config.yourWallet || !config.tools || !config.serverDescription?.trim()) {
      return NextResponse.json(
        { error: "Invalid configuration - all fields are required including server description" },
        { status: 400 }
      );
    }

    // Fetch full tool schemas from upstream server
    console.log('[SAVE] Fetching tools from upstream:', config.upstreamUrl);
    let upstreamTools: any[] = [];
    try {
      const client = new Client(
        { name: 'config-saver', version: '1.0.0' },
        { capabilities: {} }
      );
      const transport = new StreamableHTTPClientTransport(new URL(config.upstreamUrl));
      await client.connect(transport);
      const toolsResponse = await client.listTools();
      upstreamTools = toolsResponse.tools;
      console.log('[SAVE] Fetched upstream tools:', upstreamTools.map(t => t.name));
      await client.close();
    } catch (error: any) {
      console.error('[SAVE] Failed to fetch upstream tools:', error.message);
      // Continue anyway - we'll save without inputSchema
    }

    // Get Privy user ID from authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Unauthorized - missing authorization header" },
        { status: 401 }
      );
    }

    // Extract user ID from "Bearer <user_id>" format
    const userId = authHeader.replace("Bearer ", "");
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - invalid user ID" },
        { status: 401 }
      );
    }

    // Ensure user exists in database before creating config
    await db.upsertUser({
      id: userId,
      email: null, // Will be set by user sync hook if available
      wallet_address: config.yourWallet,
    });

    // Merge inputSchema from upstream tools into config tools
    const toolsWithSchema = config.tools.map((tool: any) => {
      const upstreamTool = upstreamTools.find(ut => ut.name === tool.name);
      return {
        ...tool,
        input_schema: upstreamTool?.inputSchema || null
      };
    });

    console.log('[SAVE] Tools with schema:', toolsWithSchema.map((t: any) => ({
      name: t.name,
      hasSchema: !!t.input_schema
    })));

    // Save configuration to database
    const configId = await db.createConfig(userId, {
      upstream_url: config.upstreamUrl,
      server_name: config.serverName || "Unknown Server",
      server_description: config.serverDescription,
      wallet_address: config.yourWallet,
      tools: toolsWithSchema,
    });

    // Generate multi-tenant proxy URL
    const proxyBase = process.env.PROXY_BASE;
    const proxyUrl = `${proxyBase}/mcp/${configId}`;

    return NextResponse.json({
      success: true,
      message: "Configuration saved successfully",
      configId,
      proxyUrl,
    });
  } catch (error: any) {
    console.error("Error saving configuration:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save configuration" },
      { status: 500 }
    );
  }
}

