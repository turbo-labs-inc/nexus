"use client";

import { MCPServerConfig, MCPCapability } from "../types";

/**
 * Validates an MCP configuration
 */
export function validateMCPConfig(config: any): string | null {
  // Check required fields
  if (!config.id) return "Missing server ID";
  if (!config.name) return "Missing server name";
  if (!config.url) return "Missing server URL";
  
  // Validate URL format
  try {
    new URL(config.url);
  } catch (error) {
    return "Invalid server URL";
  }
  
  // Check capabilities
  if (!Array.isArray(config.capabilities)) {
    return "Capabilities must be an array";
  }
  
  // Validate each capability
  for (const capability of config.capabilities) {
    if (!capability.id) return "Missing capability ID";
    if (!capability.type) return "Missing capability type";
    if (!["tool", "resource", "prompt"].includes(capability.type)) {
      return `Invalid capability type: ${capability.type}`;
    }
    if (!capability.name) return "Missing capability name";
  }
  
  return null;
}

/**
 * Loads an MCP configuration from a JSON object
 */
export function loadMCPConfigFromJSON(json: any): MCPServerConfig {
  // Validate configuration
  const validationError = validateMCPConfig(json);
  if (validationError) {
    throw new Error(`Invalid MCP configuration: ${validationError}`);
  }
  
  // Convert to MCPServerConfig
  const config: MCPServerConfig = {
    id: json.id,
    name: json.name,
    url: json.url,
    apiKey: json.apiKey,
    description: json.description,
    capabilities: json.capabilities.map((c: any) => ({
      id: c.id,
      type: c.type as "tool" | "resource" | "prompt",
      name: c.name,
      description: c.description || "",
      version: c.version || "1.0.0",
      schema: c.schema || {},
      serverId: json.id,
      isActive: c.isActive !== false,
      metadata: c.metadata || {},
    })),
    isActive: json.isActive !== false,
    status: "unknown",
    createdAt: new Date(json.createdAt || Date.now()),
    updatedAt: new Date(json.updatedAt || Date.now()),
  };
  
  return config;
}

/**
 * Loads an MCP configuration from a local file
 */
export async function loadMCPConfigFromFile(file: File): Promise<MCPServerConfig> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const config = loadMCPConfigFromJSON(json);
        resolve(config);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsText(file);
  });
}

/**
 * Exports an MCP configuration to a JSON string
 */
export function exportMCPConfigToJSON(config: MCPServerConfig): string {
  return JSON.stringify(config, null, 2);
}

/**
 * Generates a new MCP server configuration with default values
 */
export function generateDefaultMCPConfig(name: string, url: string): MCPServerConfig {
  const id = `mcp-server-${Date.now()}`;
  
  return {
    id,
    name,
    url,
    description: `MCP server: ${name}`,
    capabilities: [],
    isActive: true,
    status: "unknown",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}