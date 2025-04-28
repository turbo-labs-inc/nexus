/**
 * MCP Capability
 * Represents a specific capability that an MCP server provides
 */
export interface MCPCapability {
  id: string;
  type: "tool" | "resource" | "prompt" | "model" | "component" | "slack";
  name: string;
  description: string;
  version: string;
  schema: Record<string, any>;
  serverId: string;
  isActive: boolean;
  metadata?: Record<string, any>;
}