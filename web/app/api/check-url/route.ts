import { NextRequest, NextResponse } from "next/server";
import { db } from "@/shared/database";

export async function POST(request: NextRequest) {
  try {
    const { upstreamUrl } = await request.json();

    if (!upstreamUrl || typeof upstreamUrl !== 'string') {
      return NextResponse.json(
        { error: "upstream URL is required" },
        { status: 400 }
      );
    }

    // Normalize the URL (trim whitespace, convert to lowercase)
    const normalizedUrl = upstreamUrl.trim().toLowerCase();

    // Check if URL already exists in database
    const result = await db.isUpstreamUrlMonetized(normalizedUrl);

    return NextResponse.json({
      exists: result.exists,
      serverName: result.config?.server_name || null,
      userId: result.config?.user_id || null,
    });
  } catch (error: any) {
    console.error("Error checking URL:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check URL" },
      { status: 500 }
    );
  }
}
