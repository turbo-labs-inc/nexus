import { NextRequest, NextResponse } from "next/server";
import { getMCPServerManager } from "@/lib/mcp/server/manager";
import { useSupabaseServer } from "@/lib/supabase/server";

/**
 * @route GET /api/mcp/servers/:id
 * @description Get a specific MCP server by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const manager = getMCPServerManager();
    const server = manager.getServer(id);
    
    if (!server) {
      return NextResponse.json(
        { error: `Server with ID ${id} not found` },
        { status: 404 }
      );
    }
    
    return NextResponse.json(server);
  } catch (error: any) {
    console.error(`Error fetching MCP server ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to fetch server", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * @route PUT /api/mcp/servers/:id
 * @description Update an MCP server configuration
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updates = await request.json();
    
    // Get existing server
    const manager = getMCPServerManager();
    const server = manager.getServer(id);
    
    if (!server) {
      return NextResponse.json(
        { error: `Server with ID ${id} not found` },
        { status: 404 }
      );
    }
    
    // Apply updates
    const updatedConfig = {
      ...server,
      ...updates,
      updatedAt: new Date()
    };
    
    // Unregister old server and register updated one
    manager.unregisterServer(id);
    manager.registerServer(updatedConfig);
    
    // Update in Supabase
    const supabase = useSupabaseServer();
    await supabase.from("mcp_configs").update({
      config: updatedConfig,
      updated_at: new Date().toISOString()
    }).eq("id", id);
    
    return NextResponse.json({ success: true, serverId: id });
  } catch (error: any) {
    console.error(`Error updating MCP server ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to update server", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * @route DELETE /api/mcp/servers/:id
 * @description Delete an MCP server
 */
export async function DELETE(
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
    
    // Unregister server
    manager.unregisterServer(id);
    
    // Delete from Supabase
    const supabase = useSupabaseServer();
    await supabase.from("mcp_configs").delete().eq("id", id);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`Error deleting MCP server ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to delete server", message: error.message },
      { status: 500 }
    );
  }
}