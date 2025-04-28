"use client";

import { MCPServerConfig, MCPServerConnectionEvent } from "../types";

/**
 * WebSocket client for MCP server communication
 * Handles real-time communication with MCP servers
 */
export class MCPWebSocketClient {
  private ws: WebSocket | null = null;
  private serverConfig: MCPServerConfig;
  private connectionAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000; // Start with 1 second delay
  private eventListeners: ((event: MCPServerConnectionEvent) => void)[] = [];
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastReceivedMessage: number = Date.now();
  private connectionTimeout: NodeJS.Timeout | null = null;

  /**
   * Create a new WebSocket client for an MCP server
   */
  constructor(serverConfig: MCPServerConfig) {
    this.serverConfig = serverConfig;
  }

  /**
   * Connect to the MCP server
   */
  async connect(): Promise<boolean> {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return true; // Already connected or connecting
    }

    this.connectionAttempts++;

    return new Promise((resolve) => {
      try {
        // Convert HTTP URL to WebSocket URL
        let wsUrl = this.serverConfig.url.replace(/^http/, "ws");

        // Ensure URL ends with /ws for the WebSocket endpoint
        if (!wsUrl.endsWith("/ws")) {
          wsUrl = wsUrl.endsWith("/") ? `${wsUrl}ws` : `${wsUrl}/ws`;
        }

        // Set up connection timeout
        this.connectionTimeout = setTimeout(() => {
          if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
            this.ws.close();
            this.emitEvent({
              type: "error",
              serverId: this.serverConfig.id,
              timestamp: new Date(),
              error: new Error("Connection timeout"),
            });
            resolve(false);
          }
        }, 10000); // 10 second timeout

        // Create WebSocket connection
        this.ws = new WebSocket(wsUrl);

        // Set up event handlers
        this.ws.onopen = () => {
          this.clearConnectionTimeout();
          this.connectionAttempts = 0;
          this.lastReceivedMessage = Date.now();

          // Set up heartbeat to keep connection alive
          this.startHeartbeat();

          // Send authentication if API key is provided
          if (this.serverConfig.apiKey) {
            this.sendMessage({
              type: "auth",
              apiKey: this.serverConfig.apiKey,
            });
          }

          // Emit connected event
          this.emitEvent({
            type: "connected",
            serverId: this.serverConfig.id,
            timestamp: new Date(),
          });

          resolve(true);
        };

        this.ws.onmessage = (event) => {
          this.lastReceivedMessage = Date.now();

          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        };

        this.ws.onclose = (event) => {
          this.clearConnectionTimeout();
          this.stopHeartbeat();

          // Emit disconnected event
          this.emitEvent({
            type: "disconnected",
            serverId: this.serverConfig.id,
            timestamp: new Date(),
            reason: event.wasClean ? "clean_disconnect" : "connection_lost",
          });

          // Attempt to reconnect if connection was lost unexpectedly
          if (!event.wasClean && this.connectionAttempts < this.maxReconnectAttempts) {
            const delay = Math.min(
              this.reconnectDelay * Math.pow(1.5, this.connectionAttempts - 1),
              30000
            );
            setTimeout(() => this.connect(), delay);
            resolve(false);
          } else {
            resolve(false);
          }
        };

        this.ws.onerror = (error) => {
          this.clearConnectionTimeout();

          // Emit error event
          this.emitEvent({
            type: "error",
            serverId: this.serverConfig.id,
            timestamp: new Date(),
            error,
          });

          // Error is followed by close event, so we don't resolve here
        };
      } catch (error) {
        this.clearConnectionTimeout();

        // Emit error event
        this.emitEvent({
          type: "error",
          serverId: this.serverConfig.id,
          timestamp: new Date(),
          error,
        });

        resolve(false);
      }
    });
  }

  /**
   * Disconnect from the MCP server
   */
  disconnect(): void {
    this.clearConnectionTimeout();
    this.stopHeartbeat();

    if (this.ws) {
      try {
        this.ws.close(1000, "Normal closure");
      } catch (error) {
        console.error("Error closing WebSocket:", error);
      }

      this.ws = null;
    }
  }

  /**
   * Send a message to the MCP server
   */
  sendMessage(message: any): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error("Error sending WebSocket message:", error);
      return false;
    }
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
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    // Send a ping every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      // Check if we've received a message in the last 60 seconds
      const now = Date.now();
      if (now - this.lastReceivedMessage > 60000) {
        // No message received in the last 60 seconds, consider connection dead
        console.warn(
          `No message from server ${this.serverConfig.id} in 60 seconds, closing connection`
        );
        this.disconnect();
        return;
      }

      // Send heartbeat
      this.sendMessage({ type: "ping", timestamp: now });
    }, 30000);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Clear connection timeout
   */
  private clearConnectionTimeout(): void {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
  }

  /**
   * Handle incoming messages from the MCP server
   */
  private handleMessage(message: any): void {
    switch (message.type) {
      case "pong":
        // Handle pong (response to our ping)
        break;

      case "status":
        // Handle status update
        this.emitEvent({
          type: "status_change",
          serverId: this.serverConfig.id,
          timestamp: new Date(),
          status: message.status,
        });
        break;

      case "capabilities":
        // Handle capabilities update
        if (Array.isArray(message.capabilities)) {
          // Process and emit the capabilities update
          // Listeners can capture this to register capabilities
          this.emitEvent({
            type: "capabilities_update",
            serverId: this.serverConfig.id,
            timestamp: new Date(),
            capabilities: message.capabilities,
          });
        }
        break;

      case "tool_result":
        // Handle tool execution result
        if (message.requestId) {
          this.emitEvent({
            type: "tool_result",
            serverId: this.serverConfig.id,
            timestamp: new Date(),
            requestId: message.requestId,
            result: message.result,
          });
        }
        break;

      case "resource_result":
        // Handle resource query result
        if (message.requestId) {
          this.emitEvent({
            type: "resource_result",
            serverId: this.serverConfig.id,
            timestamp: new Date(),
            requestId: message.requestId,
            result: message.result,
          });
        }
        break;

      case "prompt_result":
        // Handle prompt rendering result
        if (message.requestId) {
          this.emitEvent({
            type: "prompt_result",
            serverId: this.serverConfig.id,
            timestamp: new Date(),
            requestId: message.requestId,
            result: message.result,
          });
        }
        break;

      case "error":
        // Handle error message
        this.emitEvent({
          type: "error",
          serverId: this.serverConfig.id,
          timestamp: new Date(),
          error: new Error(message.message || "Unknown server error"),
        });
        break;

      default:
        // Log unrecognized message types
        console.log(`Unrecognized message type from server ${this.serverConfig.id}:`, message.type);
        break;
    }
  }

  /**
   * Emit an event to all listeners
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
   * Check if the WebSocket is connected
   */
  isConnected(): boolean {
    return !!this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get the current connection state
   */
  getState(): "connecting" | "connected" | "disconnected" | "error" {
    if (!this.ws) {
      return "disconnected";
    }

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return "connecting";
      case WebSocket.OPEN:
        return "connected";
      case WebSocket.CLOSING:
      case WebSocket.CLOSED:
      default:
        return "disconnected";
    }
  }
}
