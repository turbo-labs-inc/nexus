import { NextRequest, NextResponse } from "next/server";
import { MCPClient } from "@/lib/mcp/server/client";
import { logger } from "@/lib/mcp/utils";
import { v4 as uuidv4 } from "uuid";

/**
 * @route POST /api/mcp/servers/test-connection
 * @description Test connection to an MCP server
 * @body { url: string, apiKey?: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { url, apiKey } = body;
    
    // Validate URL
    if (!url) {
      return NextResponse.json(
        { error: "Missing required field: url" },
        { status: 400 }
      );
    }
    
    // Create a temporary server config
    const tempServerId = uuidv4();
    const tempServer = {
      id: tempServerId,
      name: "Test Connection",
      url,
      apiKey,
      capabilities: [],
      isActive: true,
      status: "unknown" as "unknown" | "online" | "offline" | "error",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    logger.info(`Testing connection to MCP server: ${url}`, { tempServerId }, tempServerId, "test-connection");
    
    // Create client
    const client = new MCPClient(tempServer);
    
    // Check health
    const isHealthy = await client.checkHealth();
    
    if (!isHealthy) {
      return NextResponse.json(
        { success: false, message: "Server health check failed" },
        { status: 500 }
      );
    }
    
    // Get capabilities
    const capabilities = await client.getCapabilities();
    
    logger.info(
      `Connection test successful: ${url}`,
      { 
        tempServerId,
        capabilitiesCount: capabilities.length
      },
      tempServerId,
      "test-connection"
    );
    
    return NextResponse.json({
      success: true,
      capabilities
    });
  } catch (error: any) {
    logger.error("Error testing MCP server connection:", { error }, undefined, "test-connection");
    
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || "Failed to connect to server"
      },
      { status: 500 }
    );
  }
}