import { NextRequest, NextResponse } from "next/server";
import { getMCPServerManager } from "@/lib/mcp/server/manager";

/**
 * @route GET /api/mcp/servers/:id/status
 * @description Get the status of an MCP server
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const manager = getMCPServerManager();
    
    // Get server status
    const status = manager.getServerStatus(id);
    
    if (!status) {
      return NextResponse.json(
        { error: `Server with ID ${id} not found` },
        { status: 404 }
      );
    }
    
    return NextResponse.json(status);
  } catch (error: any) {
    console.error(`Error getting MCP server status ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to get server status", message: error.message },
      { status: 500 }
    );
  }
}