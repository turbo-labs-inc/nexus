"use client";

import { useEffect, useState, useCallback } from "react";
import {
  MCPServerConfig,
  MCPServerStatus,
  MCPCapability,
  MCPToolExecutionResult,
  MCPResourceQueryResult,
  MCPPromptRenderingResult,
  MCPServerOperation,
  MCPServerConnectionEvent,
} from "../types";
import { logger } from "../utils/logger";
import { handleMCPError, MCPErrorType, withMCPErrorHandling } from "../utils/error-handler";
import { metrics, MetricType } from "../utils/metrics";

/**
 * MCP Server Manager Class
 *
 * This class is responsible for managing MCP servers, including:
 * - Registering servers
 * - Managing server lifecycle (connect, disconnect)
 * - Executing operations on servers (tools, resource queries, prompt rendering)
 * - Monitoring server status
 */
export class MCPServerManager {
  private servers: Map<string, MCPServerConfig> = new Map();
  private serverStatuses: Map<string, MCPServerStatus> = new Map();
  private capabilities: Map<string, MCPCapability> = new Map();
  private connections: Map<string, import("./ws-client").MCPWebSocketClient> = new Map();
  private eventListeners: ((event: MCPServerConnectionEvent) => void)[] = [];

  /**
   * Initialize the server manager with existing configurations
   */
  constructor(initialServers: MCPServerConfig[] = []) {
    // Register initial servers
    initialServers.forEach((server) => {
      this.registerServer(server);
    });
  }

  /**
   * Register a new MCP server
   */
  registerServer(config: MCPServerConfig): void {
    try {
      logger.info(
        `Registering MCP server: ${config.name} (${config.id})`,
        { url: config.url },
        config.id,
        "server-manager"
      );
      
      // Add server to registry
      this.servers.set(config.id, config);
      
      // Register capabilities
      config.capabilities.forEach((capability) => {
        this.capabilities.set(capability.id, {
          ...capability,
          serverId: config.id,
        });
        
        logger.debug(
          `Registered capability: ${capability.name} (${capability.id})`,
          { type: capability.type },
          config.id,
          "server-manager"
        );
      });
      
      // Initialize status
      this.serverStatuses.set(config.id, {
        serverId: config.id,
        status: "unknown",
        lastChecked: new Date(),
      });
      
      // Emit event
      this.emitEvent({
        type: "status_change",
        serverId: config.id,
        timestamp: new Date(),
        status: "unknown",
      });
      
      // Record metrics
      metrics.incrementCounter(
        MetricType.SERVER_CONNECTION_COUNT,
        1,
        config.id,
        { action: "register" }
      );
      
      logger.info(
        `MCP server registered successfully: ${config.name} (${config.id})`,
        { capabilityCount: config.capabilities.length },
        config.id,
        "server-manager"
      );
    } catch (error) {
      const mcpError = handleMCPError(
        MCPErrorType.INTERNAL_ERROR,
        `Failed to register server: ${error instanceof Error ? error.message : String(error)}`,
        error,
        config.id,
        "registration_error",
        "server-manager"
      );
      
      logger.error(
        `Error registering MCP server: ${config.name} (${config.id})`,
        { error: mcpError },
        config.id,
        "server-manager"
      );
      
      throw error;
    }
  }

  /**
   * Unregister an MCP server
   */
  unregisterServer(serverId: string): void {
    // Get server config
    const server = this.servers.get(serverId);
    if (!server) return;

    // Remove capabilities
    server.capabilities.forEach((capability) => {
      this.capabilities.delete(capability.id);
    });

    // Disconnect if connected
    const wsClient = this.connections.get(serverId);
    if (wsClient) {
      wsClient.disconnect();
      this.connections.delete(serverId);
    }

    // Remove server
    this.servers.delete(serverId);
    this.serverStatuses.delete(serverId);

    // Emit event
    this.emitEvent({
      type: "disconnected",
      serverId,
      timestamp: new Date(),
      reason: "unregistered",
    });
  }

  /**
   * Connect to an MCP server
   */
  async connectToServer(serverId: string): Promise<boolean> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server with ID ${serverId} not found`);
    }

    try {
      // Update status to connecting
      this.updateServerStatus(serverId, "unknown");

      // Get or create a WebSocket client for this server
      let wsClient = this.connections.get(serverId);

      // If no client exists, create one
      if (!wsClient) {
        // Dynamically import the WebSocket client to avoid circular dependencies
        const { MCPWebSocketClient } = await import("./ws-client");
        wsClient = new MCPWebSocketClient(server);

        // Add event listener for WebSocket events
        wsClient.addEventListener((event) => {
          // Forward the event
          this.handleWebSocketEvent(event);
        });

        // Store the client
        this.connections.set(serverId, wsClient);
      }

      // Connect to the server
      const connected = await wsClient.connect();

      if (connected) {
        // Update status if connection was successful
        this.updateServerStatus(serverId, "online");
        return true;
      } else {
        // Update status if connection failed
        this.updateServerStatus(serverId, "error");
        return false;
      }
    } catch (error) {
      // Update status
      this.updateServerStatus(serverId, "error");

      // Emit event
      this.emitEvent({
        type: "error",
        serverId,
        timestamp: new Date(),
        error,
      });

      return false;
    }
  }

  /**
   * Disconnect from an MCP server
   */
  async disconnectFromServer(serverId: string): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server with ID ${serverId} not found`);
    }

    try {
      // Get the WebSocket client
      const wsClient = this.connections.get(serverId);

      // If a client exists, disconnect it
      if (wsClient) {
        wsClient.disconnect();
      }

      // Update status
      this.updateServerStatus(serverId, "offline");
    } catch (error) {
      // Emit event
      this.emitEvent({
        type: "error",
        serverId,
        timestamp: new Date(),
        error,
      });
    }
  }

  /**
   * Handle WebSocket events from the client
   */
  private handleWebSocketEvent(event: MCPServerConnectionEvent): void {
    // Forward the event to listeners
    this.emitEvent(event);

    // Process specific events
    switch (event.type) {
      case "status_change":
        // Update server status
        this.updateServerStatus(event.serverId, event.status);
        break;

      case "capabilities_update":
        // Update capabilities
        if (event.capabilities) {
          event.capabilities.forEach((capability) => {
            this.capabilities.set(capability.id, {
              ...capability,
              serverId: event.serverId,
            });
          });
        }
        break;

      case "disconnected":
        // Update server status
        this.updateServerStatus(event.serverId, "offline");
        break;

      case "error":
        // Update server status if it's a connection error
        // We don't want to mark the server as error for every error event
        // only for connection-related errors
        if (
          event.error &&
          (event.error.message?.includes("connection") ||
            event.error.message?.includes("websocket"))
        ) {
          this.updateServerStatus(event.serverId, "error");
        }
        break;
    }
  }

  /**
   * Execute a tool on an MCP server
   */
  async executeTool<T = any>(
    toolId: string,
    parameters: Record<string, any>
  ): Promise<MCPToolExecutionResult<T>> {
    // Get capability
    const capability = this.capabilities.get(toolId);
    if (!capability || capability.type !== "tool") {
      return {
        success: false,
        error: {
          code: "tool_not_found",
          message: `Tool with ID ${toolId} not found`,
        },
      };
    }

    // Get server
    const serverId = capability.serverId;
    const server = this.servers.get(serverId);
    if (!server) {
      return {
        success: false,
        error: {
          code: "server_not_found",
          message: `Server with ID ${serverId} not found`,
        },
      };
    }

    // Check server status
    const status = this.serverStatuses.get(serverId);
    if (!status || status.status !== "online") {
      return {
        success: false,
        error: {
          code: "server_offline",
          message: `Server with ID ${serverId} is not online`,
        },
      };
    }

    try {
      // Get the WebSocket client
      const wsClient = this.connections.get(serverId);
      if (!wsClient || !wsClient.isConnected()) {
        // Try to connect if not already connected
        if (!wsClient) {
          const connected = await this.connectToServer(serverId);
          if (!connected) {
            throw new Error("Failed to connect to server");
          }
        } else if (!wsClient.isConnected()) {
          const connected = await wsClient.connect();
          if (!connected) {
            throw new Error("Failed to connect to server");
          }
        }
      }

      // Generate a request ID
      const requestId = `tool_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Create a promise that will be resolved when the result is received
      return new Promise<MCPToolExecutionResult<T>>((resolve, reject) => {
        // Set up timeout
        const timeout = setTimeout(() => {
          // Remove the event listener
          if (wsClient) {
            wsClient.removeEventListener(handleToolResult);
          }

          // Reject the promise
          reject(new Error("Tool execution timed out"));
        }, 30000); // 30 second timeout

        // Set up event listener for tool result
        const handleToolResult = (event: MCPServerConnectionEvent) => {
          if (event.type === "tool_result" && event.requestId === requestId) {
            // Clear the timeout
            clearTimeout(timeout);

            // Remove the event listener
            if (wsClient) {
              wsClient.removeEventListener(handleToolResult);
            }

            // Resolve the promise with the result
            resolve(event.result as MCPToolExecutionResult<T>);
          }
        };

        // Add the event listener
        if (wsClient) {
          wsClient.addEventListener(handleToolResult);

          // Send the request
          wsClient.sendMessage({
            type: "tool_execution",
            requestId,
            toolId,
            parameters,
          });
        } else {
          // This shouldn't happen, but just in case
          reject(new Error("WebSocket client not initialized"));
        }
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: "execution_error",
          message: error.message || "Unknown error during tool execution",
        },
      };
    }
  }

  /**
   * Query a resource on an MCP server
   */
  async queryResource<T = any>(
    resourceId: string,
    query: Record<string, any>
  ): Promise<MCPResourceQueryResult<T>> {
    // Get capability
    const capability = this.capabilities.get(resourceId);
    if (!capability || capability.type !== "resource") {
      return {
        success: false,
        error: {
          code: "resource_not_found",
          message: `Resource with ID ${resourceId} not found`,
        },
      };
    }

    // Get server
    const serverId = capability.serverId;
    const server = this.servers.get(serverId);
    if (!server) {
      return {
        success: false,
        error: {
          code: "server_not_found",
          message: `Server with ID ${serverId} not found`,
        },
      };
    }

    // Check server status
    const status = this.serverStatuses.get(serverId);
    if (!status || status.status !== "online") {
      return {
        success: false,
        error: {
          code: "server_offline",
          message: `Server with ID ${serverId} is not online`,
        },
      };
    }

    try {
      // Get the WebSocket client
      const wsClient = this.connections.get(serverId);
      if (!wsClient || !wsClient.isConnected()) {
        // Try to connect if not already connected
        if (!wsClient) {
          const connected = await this.connectToServer(serverId);
          if (!connected) {
            throw new Error("Failed to connect to server");
          }
        } else if (!wsClient.isConnected()) {
          const connected = await wsClient.connect();
          if (!connected) {
            throw new Error("Failed to connect to server");
          }
        }
      }

      // Generate a request ID
      const requestId = `resource_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Create a promise that will be resolved when the result is received
      return new Promise<MCPResourceQueryResult<T>>((resolve, reject) => {
        // Set up timeout
        const timeout = setTimeout(() => {
          // Remove the event listener
          if (wsClient) {
            wsClient.removeEventListener(handleResourceResult);
          }

          // Reject the promise
          reject(new Error("Resource query timed out"));
        }, 30000); // 30 second timeout

        // Set up event listener for resource result
        const handleResourceResult = (event: MCPServerConnectionEvent) => {
          if (event.type === "resource_result" && event.requestId === requestId) {
            // Clear the timeout
            clearTimeout(timeout);

            // Remove the event listener
            if (wsClient) {
              wsClient.removeEventListener(handleResourceResult);
            }

            // Resolve the promise with the result
            resolve(event.result as MCPResourceQueryResult<T>);
          }
        };

        // Add the event listener
        if (wsClient) {
          wsClient.addEventListener(handleResourceResult);

          // Send the request
          wsClient.sendMessage({
            type: "resource_query",
            requestId,
            resourceId,
            query,
          });
        } else {
          // This shouldn't happen, but just in case
          reject(new Error("WebSocket client not initialized"));
        }
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: "query_error",
          message: error.message || "Unknown error during resource query",
        },
      };
    }
  }

  /**
   * Render a prompt on an MCP server
   */
  async renderPrompt(
    promptId: string,
    variables: Record<string, any>
  ): Promise<MCPPromptRenderingResult> {
    // Get capability
    const capability = this.capabilities.get(promptId);
    if (!capability || capability.type !== "prompt") {
      return {
        success: false,
        error: {
          code: "prompt_not_found",
          message: `Prompt with ID ${promptId} not found`,
        },
      };
    }

    // Get server
    const serverId = capability.serverId;
    const server = this.servers.get(serverId);
    if (!server) {
      return {
        success: false,
        error: {
          code: "server_not_found",
          message: `Server with ID ${serverId} not found`,
        },
      };
    }

    // Check server status
    const status = this.serverStatuses.get(serverId);
    if (!status || status.status !== "online") {
      return {
        success: false,
        error: {
          code: "server_offline",
          message: `Server with ID ${serverId} is not online`,
        },
      };
    }

    try {
      // Get the WebSocket client
      const wsClient = this.connections.get(serverId);
      if (!wsClient || !wsClient.isConnected()) {
        // Try to connect if not already connected
        if (!wsClient) {
          const connected = await this.connectToServer(serverId);
          if (!connected) {
            throw new Error("Failed to connect to server");
          }
        } else if (!wsClient.isConnected()) {
          const connected = await wsClient.connect();
          if (!connected) {
            throw new Error("Failed to connect to server");
          }
        }
      }

      // Generate a request ID
      const requestId = `prompt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // Create a promise that will be resolved when the result is received
      return new Promise<MCPPromptRenderingResult>((resolve, reject) => {
        // Set up timeout
        const timeout = setTimeout(() => {
          // Remove the event listener
          if (wsClient) {
            wsClient.removeEventListener(handlePromptResult);
          }

          // Reject the promise
          reject(new Error("Prompt rendering timed out"));
        }, 30000); // 30 second timeout

        // Set up event listener for prompt result
        const handlePromptResult = (event: MCPServerConnectionEvent) => {
          if (event.type === "prompt_result" && event.requestId === requestId) {
            // Clear the timeout
            clearTimeout(timeout);

            // Remove the event listener
            if (wsClient) {
              wsClient.removeEventListener(handlePromptResult);
            }

            // Resolve the promise with the result
            resolve(event.result as MCPPromptRenderingResult);
          }
        };

        // Add the event listener
        if (wsClient) {
          wsClient.addEventListener(handlePromptResult);

          // Send the request
          wsClient.sendMessage({
            type: "prompt_rendering",
            requestId,
            promptId,
            variables,
          });
        } else {
          // This shouldn't happen, but just in case
          reject(new Error("WebSocket client not initialized"));
        }
      });
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: "rendering_error",
          message: error.message || "Unknown error during prompt rendering",
        },
      };
    }
  }

  /**
   * Get all registered servers
   */
  getServers(): MCPServerConfig[] {
    return Array.from(this.servers.values());
  }

  /**
   * Get a specific server by ID
   */
  getServer(serverId: string): MCPServerConfig | undefined {
    return this.servers.get(serverId);
  }

  /**
   * Get the status of a specific server
   */
  getServerStatus(serverId: string): MCPServerStatus | undefined {
    return this.serverStatuses.get(serverId);
  }

  /**
   * Get all server statuses
   */
  getAllServerStatuses(): MCPServerStatus[] {
    return Array.from(this.serverStatuses.values());
  }

  /**
   * Get all capabilities
   */
  getAllCapabilities(): MCPCapability[] {
    return Array.from(this.capabilities.values());
  }

  /**
   * Get capabilities by server
   */
  getCapabilitiesByServer(serverId: string): MCPCapability[] {
    return Array.from(this.capabilities.values()).filter((c) => c.serverId === serverId);
  }

  /**
   * Get capabilities by type
   */
  getCapabilitiesByType(type: "tool" | "resource" | "prompt"): MCPCapability[] {
    return Array.from(this.capabilities.values()).filter((c) => c.type === type);
  }

  /**
   * Add an event listener
   */
  addEventListener(listener: (event: MCPServerConnectionEvent) => void): void {
    this.eventListeners.push(listener);
  }

  /**
   * Remove an event listener
   */
  removeEventListener(listener: (event: MCPServerConnectionEvent) => void): void {
    const index = this.eventListeners.indexOf(listener);
    if (index !== -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * Emit an event
   */
  private emitEvent(event: MCPServerConnectionEvent): void {
    this.eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error("Error in event listener:", error);
      }
    });
  }

  /**
   * Update server status
   */
  private updateServerStatus(
    serverId: string,
    status: "online" | "offline" | "error" | "unknown",
    errorMessage?: string
  ): void {
    const server = this.servers.get(serverId);
    if (!server) return;

    // Update server config
    server.status = status;

    // Update status object
    const serverStatus = this.serverStatuses.get(serverId) || {
      serverId,
      status: "unknown",
      lastChecked: new Date(),
    };

    const updatedStatus: MCPServerStatus = {
      ...serverStatus,
      status,
      lastChecked: new Date(),
      errorMessage: status === "error" ? errorMessage : undefined,
    };

    this.serverStatuses.set(serverId, updatedStatus);

    // Emit event
    this.emitEvent({
      type: "status_change",
      serverId,
      timestamp: new Date(),
      status,
    });
  }
}

// Singleton instance of the MCP server manager
let serverManagerInstance: MCPServerManager | null = null;

/**
 * Get the MCP server manager instance
 */
export function getMCPServerManager(): MCPServerManager {
  if (!serverManagerInstance) {
    serverManagerInstance = new MCPServerManager();
  }
  return serverManagerInstance;
}

/**
 * React hook for using the MCP server manager
 */
export function useMCPServerManager() {
  const [manager] = useState(() => getMCPServerManager());
  const [servers, setServers] = useState<MCPServerConfig[]>(manager.getServers());
  const [serverStatuses, setServerStatuses] = useState<MCPServerStatus[]>(
    manager.getAllServerStatuses()
  );

  // Update state when events occur
  useEffect(() => {
    const handleEvent = (event: MCPServerConnectionEvent) => {
      setServers(manager.getServers());
      setServerStatuses(manager.getAllServerStatuses());
    };

    manager.addEventListener(handleEvent);

    return () => {
      manager.removeEventListener(handleEvent);
    };
  }, [manager]);

  // Register a new server
  const registerServer = useCallback(
    (config: MCPServerConfig) => {
      manager.registerServer(config);
    },
    [manager]
  );

  // Unregister a server
  const unregisterServer = useCallback(
    (serverId: string) => {
      manager.unregisterServer(serverId);
    },
    [manager]
  );

  // Connect to a server
  const connectToServer = useCallback(
    (serverId: string) => {
      return manager.connectToServer(serverId);
    },
    [manager]
  );

  // Disconnect from a server
  const disconnectFromServer = useCallback(
    (serverId: string) => {
      return manager.disconnectFromServer(serverId);
    },
    [manager]
  );

  // Execute a tool
  const executeTool = useCallback(
    <T = any>(toolId: string, parameters: Record<string, any>) => {
      return manager.executeTool<T>(toolId, parameters);
    },
    [manager]
  );

  // Query a resource
  const queryResource = useCallback(
    <T = any>(resourceId: string, query: Record<string, any>) => {
      return manager.queryResource<T>(resourceId, query);
    },
    [manager]
  );

  // Render a prompt
  const renderPrompt = useCallback(
    (promptId: string, variables: Record<string, any>) => {
      return manager.renderPrompt(promptId, variables);
    },
    [manager]
  );

  return {
    servers,
    serverStatuses,
    registerServer,
    unregisterServer,
    connectToServer,
    disconnectFromServer,
    executeTool,
    queryResource,
    renderPrompt,
    getServer: useCallback((id: string) => manager.getServer(id), [manager]),
    getServerStatus: useCallback((id: string) => manager.getServerStatus(id), [manager]),
    getAllCapabilities: useCallback(() => manager.getAllCapabilities(), [manager]),
    getCapabilitiesByServer: useCallback(
      (id: string) => manager.getCapabilitiesByServer(id),
      [manager]
    ),
    getCapabilitiesByType: useCallback(
      (type: "tool" | "resource" | "prompt") => manager.getCapabilitiesByType(type),
      [manager]
    ),
  };
}
