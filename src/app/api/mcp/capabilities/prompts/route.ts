import { NextRequest, NextResponse } from "next/server";
import { getMCPServerManager } from "@/lib/mcp/server/manager";

/**
 * @route GET /api/mcp/capabilities/prompts
 * @description Get all MCP prompts
 */
export async function GET(request: NextRequest) {
  try {
    const manager = getMCPServerManager();
    const prompts = manager.getCapabilitiesByType("prompt");
    
    return NextResponse.json(prompts);
  } catch (error: any) {
    console.error("Error fetching MCP prompts:", error);
    return NextResponse.json(
      { error: "Failed to fetch prompts", message: error.message },
      { status: 500 }
    );
  }
}