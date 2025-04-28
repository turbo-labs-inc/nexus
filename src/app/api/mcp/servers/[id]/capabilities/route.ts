import { NextRequest, NextResponse } from "next/server";
import { getMCPServerManager } from "@/lib/mcp/server/manager";

/**
 * @route GET /api/mcp/servers/:id/capabilities
 * @description Get all capabilities for a specific MCP server
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const manager = getMCPServerManager();
    
    // Check if server exists
    const server = manager.getServer(id);
    if (!server) {
      return NextResponse.json(
        { error: `Server with ID ${id} not found` },
        { status: 404 }
      );
    }
    
    // Get capabilities for this server
    const capabilities = manager.getCapabilitiesByServer(id);
    
    return NextResponse.json(capabilities);
  } catch (error: any) {
    console.error(`Error getting capabilities for MCP server ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to get server capabilities", message: error.message },
      { status: 500 }
    );
  }
}