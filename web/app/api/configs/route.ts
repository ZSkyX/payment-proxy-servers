import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export async function GET() {
  try {
    const configsDir = path.join(process.cwd(), "../src/configs-db");

    // Check if configs directory exists
    if (!fs.existsSync(configsDir)) {
      return NextResponse.json({ configs: [] });
    }

    // Read all JSON files from configs-db
    const files = fs.readdirSync(configsDir).filter(file => file.endsWith('.json'));

    const configs = files.map(file => {
      const filePath = path.join(configsDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const config = JSON.parse(fileContent);
      const configId = file.replace('.json', '');

      return {
        id: configId,
        name: config.serverName || 'Unknown Server',
        tools: config.tools,
      };
    });

    return NextResponse.json({ configs });
  } catch (error: any) {
    console.error("Error loading configurations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load configurations" },
      { status: 500 }
    );
  }
}
