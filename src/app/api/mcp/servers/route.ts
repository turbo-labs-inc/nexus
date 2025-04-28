import { NextRequest, NextResponse } from "next/server";
import { getMCPServerManager } from "@/lib/mcp/server/manager";
import { useSupabaseServer } from "@/lib/supabase/server";

/**
 * @route GET /api/mcp/servers
 * @description Get all MCP servers
 */
export async function GET(request: NextRequest) {
  try {
    const manager = getMCPServerManager();
    const servers = manager.getServers();
    
    return NextResponse.json(servers);
  } catch (error: any) {
    console.error("Error fetching MCP servers:", error);
    return NextResponse.json(
      { error: "Failed to fetch servers", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * @route POST /api/mcp/servers
 * @description Register a new MCP server
 * @body MCPServerConfig
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const serverConfig = await request.json();
    
    // Validate required fields
    if (!serverConfig.id || !serverConfig.name || !serverConfig.url) {
      return NextResponse.json(
        { error: "Missing required fields: id, name, url" },
        { status: 400 }
      );
    }
    
    // Register server
    const manager = getMCPServerManager();
    manager.registerServer(serverConfig);
    
    // Save configuration to Supabase
    const supabase = useSupabaseServer();
    await supabase.from("mcp_configs").upsert({
      id: serverConfig.id,
      config: serverConfig,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    return NextResponse.json({ success: true, serverId: serverConfig.id });
  } catch (error: any) {
    console.error("Error registering MCP server:", error);
    return NextResponse.json(
      { error: "Failed to register server", message: error.message },
      { status: 500 }
    );
  }
}