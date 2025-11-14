import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const config = await request.json();

    // Validate config
    if (!config.upstreamUrl || !config.yourWallet || !config.tools) {
      return NextResponse.json(
        { error: "Invalid configuration" },
        { status: 400 }
      );
    }

    // Generate UUID for this config
    const configId = randomUUID();

    // Create configs directory if it doesn't exist
    const configsDir = path.join(process.cwd(), "../src/configs-db");
    if (!fs.existsSync(configsDir)) {
      fs.mkdirSync(configsDir, { recursive: true });
    }

    // Path to save config with UUID
    const configPath = path.join(configsDir, `${configId}.json`);

    // Write config file
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Generate multi-tenant proxy URL
    const proxyPort = process.env.PROXY_PORT || "3003";
    const proxyUrl = `http://localhost:${proxyPort}/mcp/${configId}`;

    return NextResponse.json({
      success: true,
      message: "Configuration saved successfully",
      configId,
      path: configPath,
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

export async function GET() {
  try {
    const configPath = path.join(
      process.cwd(),
      "../src/proxy-config.json"
    );

    if (!fs.existsSync(configPath)) {
      return NextResponse.json({ config: null });
    }

    const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    return NextResponse.json({ config });
  } catch (error: any) {
    console.error("Error loading configuration:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load configuration" },
      { status: 500 }
    );
  }
}
