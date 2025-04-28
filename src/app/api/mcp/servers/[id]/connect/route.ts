import { NextRequest, NextResponse } from "next/server";
import { getMCPServerManager } from "@/lib/mcp/server/manager";

/**
 * @route POST /api/mcp/servers/:id/connect
 * @description Connect to an MCP server
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
    
    // Connect to server
    const connected = await manager.connectToServer(id);
    
    if (connected) {
      return NextResponse.json({ success: true, status: "connected" });
    } else {
      return NextResponse.json(
        { success: false, status: "connection_failed" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error(`Error connecting to MCP server ${params.id}:`, error);
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