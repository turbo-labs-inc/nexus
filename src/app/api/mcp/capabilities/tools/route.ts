import { NextRequest, NextResponse } from "next/server";
import { getMCPServerManager } from "@/lib/mcp/server/manager";

/**
 * @route GET /api/mcp/capabilities/tools
 * @description Get all MCP tools
 */
export async function GET(request: NextRequest) {
  try {
    const manager = getMCPServerManager();
    const tools = manager.getCapabilitiesByType("tool");
    
    return NextResponse.json(tools);
  } catch (error: any) {
    console.error("Error fetching MCP tools:", error);
    return NextResponse.json(
      { error: "Failed to fetch tools", message: error.message },
      { status: 500 }
    );
  }
}