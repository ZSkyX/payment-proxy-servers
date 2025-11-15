import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const configsDir = path.join(process.cwd(), "../src/configs-db");
    const configPath = path.join(configsDir, `${id}.json`);

    if (!fs.existsSync(configPath)) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 }
      );
    }

    const fileContent = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(fileContent);

    const proxyBase = process.env.PROXY_PORT;
    const proxyUrl = `${proxyBase}/mcp/${id}`;

    return NextResponse.json({
      id,
      name: config.serverName || 'Unknown Server',
      tools: config.tools,
      proxyUrl,
    });
  } catch (error: any) {
    console.error("Error loading configuration:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load configuration" },
      { status: 500 }
    );
  }
}
