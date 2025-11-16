import { NextRequest, NextResponse } from "next/server";
import { db } from "@/shared/database";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: configId } = await params;

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

    // Verify that the config belongs to this user before deleting
    const config = await db.getConfigById(configId, userId);

    if (!config) {
      return NextResponse.json(
        { error: "Configuration not found or you do not have permission to delete it" },
        { status: 404 }
      );
    }

    // Delete the config (cascade will delete associated tools)
    await db.deleteConfig(configId, userId);

    return NextResponse.json({
      success: true,
      message: "Configuration deleted successfully"
    });
  } catch (error: any) {
    console.error("Error deleting configuration:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete configuration" },
      { status: 500 }
    );
  }
}
