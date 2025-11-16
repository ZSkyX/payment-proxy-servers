import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const proxyBase = process.env.PROXY_BASE;
    const proxyUrl = `${proxyBase}/mcp/${id}`;

    // Fetch from database (public endpoint - no auth required)
    const config = await db.getConfigByIdPublic(id);

    if (!config) {
      return NextResponse.json(
        { error: "Configuration not found" },
        { status: 404 }
      );
    }

    const tools = await db.getToolsByConfigId(id);

    return NextResponse.json({
      id,
      name: config.server_name,
      description: config.server_description || "",
      tools: tools.map(t => ({
        name: t.name,
        description: t.description || "",
        price: Number(t.price),
        enabled: t.enabled,
      })),
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
