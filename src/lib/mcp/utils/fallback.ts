"use client";

import { MCPServerConfig } from "../types";

// Fallback MCP configs to use when the database isn't available
const fallbackMcpConfigs: MCPServerConfig[] = [
  {
    id: "local-anthropic-server",
    name: "Claude AI Server",
    url: "https://api.anthropic.com/v1",
    apiKey: "dummy-key-replace-with-real-key",
    status: "offline",
    capabilities: [
      {
        id: "claude-chat",
        name: "Claude Chat",
        type: "model",
        description: "Claude chat completion",
        version: "1.0",
      },
      {
        id: "claude-vision",
        name: "Claude Vision",
        type: "model",
        description: "Claude multimodal vision capabilities",
        version: "1.0",
      }
    ]
  },
  {
    id: "local-openai-server",
    name: "OpenAI Server",
    url: "https://api.openai.com/v1",
    apiKey: "dummy-key-replace-with-real-key",
    status: "offline",
    capabilities: [
      {
        id: "gpt-4",
        name: "GPT-4",
        type: "model",
        description: "GPT-4 language model",
        version: "1.0",
      },
      {
        id: "dall-e",
        name: "DALL-E",
        type: "tool",
        description: "Image generation",
        version: "1.0",
      }
    ]
  },
];

/**
 * Checks if we should use fallback data
 */
export function shouldUseFallbackData(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check if localStorage has our fallback flag
  return window.localStorage.getItem('mcp_configs_fallback_enabled') === 'true';
}

/**
 * Gets MCP configs from localStorage fallback
 */
export function getFallbackMcpConfigs(): MCPServerConfig[] {
  if (typeof window === 'undefined') {
    return fallbackMcpConfigs;
  }
  
  try {
    // Try to get from localStorage first
    const storedConfigs = window.localStorage.getItem('fallback_mcp_configs');
    
    if (storedConfigs) {
      return JSON.parse(storedConfigs) as MCPServerConfig[];
    }
    
    // Fall back to hardcoded defaults
    return fallbackMcpConfigs;
  } catch (error) {
    console.error("Error getting fallback MCP configs:", error);
    return fallbackMcpConfigs;
  }
}

/**
 * Save fallback MCP configs to localStorage
 */
export function saveFallbackMcpConfig(config: MCPServerConfig): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Get existing configs
    const configs = getFallbackMcpConfigs();
    
    // Check if this config already exists
    const existingIndex = configs.findIndex(c => c.id === config.id);
    
    if (existingIndex >= 0) {
      // Update existing config
      configs[existingIndex] = config;
    } else {
      // Add new config
      configs.push(config);
    }
    
    // Save back to localStorage
    window.localStorage.setItem('fallback_mcp_configs', JSON.stringify(configs));
  } catch (error) {
    console.error("Error saving fallback MCP config:", error);
  }
}

/**
 * Remove a fallback MCP config
 */
export function removeFallbackMcpConfig(configId: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Get existing configs
    const configs = getFallbackMcpConfigs();
    
    // Filter out the config to remove
    const newConfigs = configs.filter(c => c.id !== configId);
    
    // Save back to localStorage
    window.localStorage.setItem('fallback_mcp_configs', JSON.stringify(newConfigs));
  } catch (error) {
    console.error("Error removing fallback MCP config:", error);
  }
}