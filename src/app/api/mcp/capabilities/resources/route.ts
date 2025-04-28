import { NextRequest, NextResponse } from "next/server";
import { getMCPServerManager } from "@/lib/mcp/server/manager";

/**
 * @route GET /api/mcp/capabilities/resources
 * @description Get all MCP resources
 */
export async function GET(request: NextRequest) {
  try {
    const manager = getMCPServerManager();
    const resources = manager.getCapabilitiesByType("resource");
    
    return NextResponse.json(resources);
  } catch (error: any) {
    console.error("Error fetching MCP resources:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources", message: error.message },
      { status: 500 }
    );
  }
}