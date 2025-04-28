"use client";

import { 
  MCPServerConfig, 
  MCPToolExecutionResult, 
  MCPResourceQueryResult, 
  MCPPromptRenderingResult,
  MCPCapability
} from "../types";

/**
 * MCP Client Class
 * 
 * This class is responsible for making API calls to MCP servers.
 */
export class MCPClient {
  private serverConfig: MCPServerConfig;
  private baseUrl: string;
  private apiKey?: string;
  
  /**
   * Create a new MCP client
   */
  constructor(serverConfig: MCPServerConfig) {
    this.serverConfig = serverConfig;
    this.baseUrl = serverConfig.url;
    this.apiKey = serverConfig.apiKey;
  }
  
  /**
   * Execute a tool on the MCP server
   */
  async executeTool<T = any>(
    toolId: string, 
    parameters: Record<string, any>
  ): Promise<MCPToolExecutionResult<T>> {
    try {
      const response = await this.makeRequest<MCPToolExecutionResult<T>>(
        `/api/tools/${toolId}/execute`,
        "POST",
        { parameters }
      );
      
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: "execution_error",
          message: error.message || "Unknown error during tool execution"
        }
      };
    }
  }
  
  /**
   * Query a resource on the MCP server
   */
  async queryResource<T = any>(
    resourceId: string, 
    query: Record<string, any>
  ): Promise<MCPResourceQueryResult<T>> {
    try {
      const response = await this.makeRequest<MCPResourceQueryResult<T>>(
        `/api/resources/${resourceId}/query`,
        "POST",
        { query }
      );
      
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: "query_error",
          message: error.message || "Unknown error during resource query"
        }
      };
    }
  }
  
  /**
   * Render a prompt on the MCP server
   */
  async renderPrompt(
    promptId: string, 
    variables: Record<string, any>
  ): Promise<MCPPromptRenderingResult> {
    try {
      const response = await this.makeRequest<MCPPromptRenderingResult>(
        `/api/prompts/${promptId}/render`,
        "POST",
        { variables }
      );
      
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: "rendering_error",
          message: error.message || "Unknown error during prompt rendering"
        }
      };
    }
  }
  
  /**
   * Get the server's capabilities
   */
  async getCapabilities(): Promise<MCPCapability[]> {
    try {
      const response = await this.makeRequest<{ capabilities: MCPCapability[] }>(
        "/api/capabilities",
        "GET"
      );
      
      return response.capabilities || [];
    } catch (error) {
      console.error("Error getting capabilities:", error);
      return [];
    }
  }
  
  /**
   * Check the server's health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.makeRequest<{ status: string }>(
        "/api/health",
        "GET"
      );
      
      return response.status === "ok";
    } catch (error) {
      console.error("Error checking health:", error);
      return false;
    }
  }
  
  /**
   * Make a request to the MCP server
   */
  private async makeRequest<T>(
    endpoint: string,
    method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
    body?: any
  ): Promise<T> {
    // Construct the URL
    const url = `${this.baseUrl.replace(/\/$/, "")}${endpoint}`;
    
    // Build the request options
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...(this.apiKey ? { "Authorization": `Bearer ${this.apiKey}` } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    };
    
    // Make the request
    const response = await fetch(url, options);
    
    // Handle errors
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`MCP server request failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    // Parse the response
    const data = await response.json();
    return data as T;
  }
}

/**
 * Create a new MCP client
 */
export function createMCPClient(serverConfig: MCPServerConfig): MCPClient {
  return new MCPClient(serverConfig);
}