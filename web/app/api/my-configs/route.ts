import { NextRequest, NextResponse } from "next/server";
import { db } from "@/shared/database";

export async function GET(request: NextRequest) {
  try {
    // Get user ID from authorization header (required)
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Unauthorized - missing authorization header" },
        { status: 401 }
      );
    }

    const userId = authHeader.replace("Bearer ", "");
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - invalid user ID" },
        { status: 401 }
      );
    }

    // Fetch user's own configs from database
    const dbConfigs = await db.getConfigsByUserId(userId);

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
