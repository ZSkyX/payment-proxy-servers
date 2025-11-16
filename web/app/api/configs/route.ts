import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    // Fetch all configs from database (public - no auth required)
    const dbConfigs = await db.getAllConfigs();

    // For each config, fetch its tools
    const configs = await Promise.all(
      dbConfigs.map(async (config) => {
        const tools = await db.getToolsByConfigId(config.id);
        return {
          id: config.id,
          name: config.server_name,
          description: config.server_description || "",
          tools: tools.map(t => ({
            name: t.name,
            description: t.description || "",
            price: Number(t.price),
            enabled: t.enabled,
          })),
        };
      })
    );

    return NextResponse.json({ configs });
  } catch (error: any) {
    console.error("Error loading configurations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to load configurations" },
      { status: 500 }
    );
  }
}
