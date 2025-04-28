import { NextRequest, NextResponse } from "next/server";
import { getMCPServerManager } from "@/lib/mcp/server/manager";

/**
 * @route POST /api/mcp/tools/execute
 * @description Execute an MCP tool
 * @body { toolId: string, parameters: Record<string, any> }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { toolId, parameters } = body;
    
    // Validate input
    if (!toolId) {
      return NextResponse.json(
        { error: "Missing required field: toolId" },
        { status: 400 }
      );
    }
    
    // Execute tool
    const manager = getMCPServerManager();
    const result = await manager.executeTool(toolId, parameters || {});
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error executing MCP tool:", error);
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: "execution_error",
          message: error.message || "An unexpected error occurred",
          details: error.stack
        }
      },
      { status: 500 }
    );
  }
}