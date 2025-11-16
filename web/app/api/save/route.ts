import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

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

    // Save configuration to database
    const configId = await db.createConfig(userId, {
      upstream_url: config.upstreamUrl,
      server_name: config.serverName || "Unknown Server",
      server_description: config.serverDescription,
      wallet_address: config.yourWallet,
      tools: config.tools,
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

