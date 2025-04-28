import { NextRequest, NextResponse } from "next/server";
import { getMCPServerManager } from "@/lib/mcp/server/manager";

/**
 * @route POST /api/mcp/resources/query
 * @description Query an MCP resource
 * @body { resourceId: string, query: Record<string, any> }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { resourceId, query } = body;
    
    // Validate input
    if (!resourceId) {
      return NextResponse.json(
        { error: "Missing required field: resourceId" },
        { status: 400 }
      );
    }
    
    // Query resource
    const manager = getMCPServerManager();
    const result = await manager.queryResource(resourceId, query || {});
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error querying MCP resource:", error);
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: "query_error",
          message: error.message || "An unexpected error occurred",
          details: error.stack
        }
      },
      { status: 500 }
    );
  }
}