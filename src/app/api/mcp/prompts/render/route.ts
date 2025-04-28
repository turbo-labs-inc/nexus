import { NextRequest, NextResponse } from "next/server";
import { getMCPServerManager } from "@/lib/mcp/server/manager";

/**
 * @route POST /api/mcp/prompts/render
 * @description Render an MCP prompt
 * @body { promptId: string, variables: Record<string, any> }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { promptId, variables } = body;
    
    // Validate input
    if (!promptId) {
      return NextResponse.json(
        { error: "Missing required field: promptId" },
        { status: 400 }
      );
    }
    
    // Render prompt
    const manager = getMCPServerManager();
    const result = await manager.renderPrompt(promptId, variables || {});
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error rendering MCP prompt:", error);
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: "rendering_error",
          message: error.message || "An unexpected error occurred",
          details: error.stack
        }
      },
      { status: 500 }
    );
  }
}