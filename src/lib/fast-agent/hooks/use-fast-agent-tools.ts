/**
 * React hook for Fast-Agent tool integrations
 */
import { useState, useCallback, useEffect } from "react";
import { useFastAgent } from "./use-fast-agent";
import { MessageType } from "../bridge";

export interface FastAgentTool {
  id: string;
  name: string;
  description: string;
  parameters: {
    type: string;
    name: string;
    description: string;
    required?: boolean;
  }[];
}

export interface ToolResponse {
  id: string;
  name: string;
  result: any;
  error?: string;
}

/**
 * Hook return type
 */
export interface UseFastAgentToolsReturn {
  // Base Fast-Agent functionality
  isConnected: boolean;
  isConnecting: boolean;
  hasError: boolean;
  errorMessage?: string;
  messages: any[];
  isThinking: boolean;
  
  // Tool-specific functionality
  availableTools: FastAgentTool[];
  registerTool: (tool: FastAgentTool) => void;
  unregisterTool: (toolId: string) => void;
  handleToolResponse: (response: ToolResponse) => Promise<void>;
  
  // Actions
  connect: (config?: any) => Promise<void>;
  disconnect: () => void;
  sendMessage: (content: string, options?: any) => Promise<void>;
  clearMessages: () => void;
}

/**
 * React hook for Fast-Agent tool integrations
 */
export function useFastAgentTools(serverUrl: string = "ws://localhost:8000/ws"): UseFastAgentToolsReturn {
  // Use the base Fast-Agent hook
  const fastAgent = useFastAgent({ url: serverUrl });
  
  // Tool-specific state
  const [availableTools, setAvailableTools] = useState<FastAgentTool[]>([]);
  
  // Listen for tool request messages
  useEffect(() => {
    const handleToolRequests = async () => {
      for (const message of fastAgent.messages) {
        if (message.type === MessageType.TOOL_REQUEST && message.data?.tool) {
          const toolId = message.data.tool.id;
          const toolName = message.data.tool.name;
          const tool = availableTools.find(t => t.id === toolId || t.name === toolName);
          
          if (tool) {
            console.log(`Tool request received for ${tool.name}`, message.data.tool);
            // Tool requests are handled by the UI, no automatic execution
          }
        }
      }
    };
    
    handleToolRequests();
  }, [fastAgent.messages, availableTools]);
  
  // Register a new tool
  const registerTool = useCallback((tool: FastAgentTool) => {
    setAvailableTools(prev => {
      // If the tool already exists, replace it
      const exists = prev.some(t => t.id === tool.id);
      if (exists) {
        return prev.map(t => t.id === tool.id ? tool : t);
      }
      // Otherwise add it
      return [...prev, tool];
    });
    
    // If connected, notify the server about the new tool
    if (fastAgent.isConnected) {
      fastAgent.sendMessage(MessageType.TOOL_RESPONSE, {
        tool_registration: {
          tools: [tool]
        }
      });
    }
  }, [fastAgent]);
  
  // Unregister a tool
  const unregisterTool = useCallback((toolId: string) => {
    setAvailableTools(prev => prev.filter(t => t.id !== toolId));
    
    // If connected, notify the server about the tool removal
    if (fastAgent.isConnected) {
      fastAgent.sendMessage(MessageType.TOOL_RESPONSE, {
        tool_unregistration: {
          tool_ids: [toolId]
        }
      });
    }
  }, [fastAgent]);
  
  // Handle tool responses
  const handleToolResponse = useCallback(async (response: ToolResponse) => {
    if (!fastAgent.isConnected) {
      throw new Error("Not connected to Fast-Agent server");
    }
    
    return fastAgent.sendMessage(MessageType.TOOL_RESPONSE, {
      tool: response
    });
  }, [fastAgent]);
  
  // Send available tools on connection
  useEffect(() => {
    if (fastAgent.isConnected && availableTools.length > 0) {
      fastAgent.sendMessage(MessageType.TOOL_RESPONSE, {
        tool_registration: {
          tools: availableTools
        }
      });
    }
  }, [fastAgent.isConnected, availableTools]);
  
  return {
    ...fastAgent,
    availableTools,
    registerTool,
    unregisterTool,
    handleToolResponse
  };
}