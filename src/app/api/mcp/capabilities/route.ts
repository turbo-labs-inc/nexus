import { NextRequest, NextResponse } from "next/server";
import { getMCPServerManager } from "@/lib/mcp/server/manager";

/**
 * @route GET /api/mcp/capabilities
 * @description Get all MCP capabilities
 */
export async function GET(request: NextRequest) {
  try {
    const manager = getMCPServerManager();
    const capabilities = manager.getAllCapabilities();
    
    return NextResponse.json(capabilities);
  } catch (error: any) {
    console.error("Error fetching MCP capabilities:", error);
    return NextResponse.json(
      { error: "Failed to fetch capabilities", message: error.message },
      { status: 500 }
    );
  }
}