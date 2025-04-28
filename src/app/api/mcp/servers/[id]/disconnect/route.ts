import { NextRequest, NextResponse } from "next/server";
import { getMCPServerManager } from "@/lib/mcp/server/manager";

/**
 * @route POST /api/mcp/servers/:id/disconnect
 * @description Disconnect from an MCP server
 */
export async function POST(
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
    
    // Disconnect from server
    await manager.disconnectFromServer(id);
    
    return NextResponse.json({ success: true, status: "disconnected" });
  } catch (error: any) {
    console.error(`Error disconnecting from MCP server ${params.id}:`, error);
    return NextResponse.json(
      { 
        success: false, 
        status: "error",
        error: error.message 
      },
      { status: 500 }
    );
  }
}