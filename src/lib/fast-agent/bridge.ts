"use client";

import { v4 as uuidv4 } from "uuid";
import {
  FastAgentConfig,
  FastAgentMessage,
  MessageType,
  MessageData,
  ServerStatus,
  BridgeEvent,
  BridgeEventCallbacks,
} from "./types";

/**
 * Fast-Agent Bridge
 *
 * This class provides a bridge between the Next.js application and the Python Fast-Agent server.
 * It handles WebSocket communication, message formatting, and state management.
 */
export class FastAgentBridge {
  private config: FastAgentConfig;
  private socket: WebSocket | null = null;
  private status: ServerStatus = ServerStatus.DISCONNECTED;
  private messageQueue: FastAgentMessage[] = [];
  private retryCount = 0;
  private retryTimeout: NodeJS.Timeout | null = null;
  private clientId: string;

  // Event listeners
  private eventListeners: Partial<Record<BridgeEvent, Array<(...args: any[]) => void>>> = {
    connect: [],
    disconnect: [],
    error: [],
    message: [],
    history: [],
  };

  /**
   * Create a new FastAgentBridge instance
   */
  constructor(config: FastAgentConfig = {}) {
    this.config = {
      url: "ws://localhost:8000/ws",
      reconnect: true,
      maxRetries: 3,
      retryDelay: 1000,
      timeout: 10000,
      ...config,
    };

    this.clientId = this.config.clientId || uuidv4();
  }

  /**
   * Connect to the Fast-Agent server
   */
  public async connect(config?: Partial<FastAgentConfig>): Promise<void> {
    // Update config if provided
    if (config) {
      this.config = { ...this.config, ...config };

      // Update clientId if provided
      if (config.clientId) {
        this.clientId = config.clientId;
      }
    }

    // Don't reconnect if already connected or connecting
    if (this.isConnected()) {
      return;
    }
    
    if (this.status === ServerStatus.CONNECTING) {
      throw new Error("Connection already in progress");
    }

    // Clear any existing retry timeout
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    
    // Reset retry count on new connection attempt
    this.retryCount = 0;

    return new Promise<void>((resolve, reject) => {
      try {
        this.status = ServerStatus.CONNECTING;
        this.emit("disconnect");

        // Construct WebSocket URL with client ID
        const wsUrl = `${this.config.url}/${this.clientId}`;

        // Create WebSocket
        this.socket = new WebSocket(wsUrl);

        // Connection timeout
        const timeout = setTimeout(() => {
          if (this.status === ServerStatus.CONNECTING) {
            this.handleConnectionError(new Error("Connection timeout"));
            reject(new Error("Connection timeout"));
          }
        }, this.config.timeout);

        // Setup event handlers
        this.socket.onopen = () => {
          clearTimeout(timeout);
          this.status = ServerStatus.CONNECTED;
          this.retryCount = 0;
          this.emit("connect");
          this.processMessageQueue();
          resolve();
        };

        this.socket.onclose = (event) => {
          clearTimeout(timeout);

          if (this.status !== ServerStatus.DISCONNECTED) {
            this.status = ServerStatus.DISCONNECTED;
            this.emit("disconnect");

            // Attempt reconnection if enabled
            if (this.config.reconnect && this.retryCount < (this.config.maxRetries || 3)) {
              this.retryCount++;
              this.retryTimeout = setTimeout(() => {
                this.connect();
              }, this.config.retryDelay || 1000);
            }
          }
        };

        this.socket.onerror = (event) => {
          clearTimeout(timeout);
          this.handleConnectionError(new Error("WebSocket error"));
          reject(new Error("WebSocket error"));
        };

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            this.emit("error", new Error(`Failed to parse message: ${error}`));
          }
        };
      } catch (error) {
        this.handleConnectionError(error as Error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the Fast-Agent server
   */
  public disconnect(): void {
    // Clear any existing retry timeout
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    if (this.socket) {
      this.status = ServerStatus.DISCONNECTED;
      this.socket.close();
      this.socket = null;
      this.emit("disconnect");
    }
  }

  /**
   * Send a message to the Fast-Agent server
   */
  public async sendMessage(
    type: string,
    data?: MessageData,
    messageId: string = uuidv4()
  ): Promise<void> {
    const message: FastAgentMessage = {
      type,
      messageId,
      data,
      timestamp: new Date().toISOString(),
    };

    if (this.isConnected()) {
      try {
        this.socket!.send(JSON.stringify(message));
      } catch (error) {
        this.queueMessage(message);
        this.emit("error", new Error(`Failed to send message: ${error}`));
      }
    } else {
      this.queueMessage(message);

      // Try to connect if not already connecting
      if (this.status !== ServerStatus.CONNECTING) {
        this.connect().catch((error) => {
          this.emit("error", error);
        });
      }
    }
  }

  /**
   * Check if connected to the server
   */
  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  /**
   * Get the current connection status
   */
  public getStatus(): ServerStatus {
    return this.status;
  }

  /**
   * Get the client ID
   */
  public getClientId(): string {
    return this.clientId;
  }

  /**
   * Register an event listener
   */
  public on<E extends BridgeEvent>(event: E, callback: BridgeEventCallbacks[E]): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }

    this.eventListeners[event]!.push(callback as any);
  }

  /**
   * Remove an event listener
   */
  public off<E extends BridgeEvent>(event: E, callback: BridgeEventCallbacks[E]): void {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event]!.filter((cb) => cb !== callback);
    }
  }

  /**
   * Handle connection errors
   */
  private handleConnectionError(error: Error): void {
    this.status = ServerStatus.ERROR;
    this.socket = null;
    this.emit("error", error);

    // Attempt reconnection if enabled
    if (this.config.reconnect && this.retryCount < (this.config.maxRetries || 3)) {
      this.retryCount++;

      this.retryTimeout = setTimeout(() => {
        this.connect();
      }, this.config.retryDelay || 1000);
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: FastAgentMessage): void {
    // Special handling for history response
    if (message.type === MessageType.HISTORY_RESPONSE && message.data?.history) {
      this.emit("history", message.data.history);
    }

    // Emit the message event
    this.emit("message", message);
  }

  /**
   * Queue a message to be sent later
   */
  private queueMessage(message: FastAgentMessage): void {
    this.messageQueue.push(message);

    // Limit queue size
    if (this.messageQueue.length > 100) {
      this.messageQueue.shift();
    }
  }

  /**
   * Process queued messages
   */
  private processMessageQueue(): void {
    if (!this.isConnected() || this.messageQueue.length === 0) {
      return;
    }

    // Process all queued messages
    const messages = [...this.messageQueue];
    this.messageQueue = [];

    for (const message of messages) {
      try {
        this.socket!.send(JSON.stringify(message));
      } catch (error) {
        this.queueMessage(message);
        this.emit("error", new Error(`Failed to send queued message: ${error}`));
        break;
      }
    }
  }

  /**
   * Emit an event
   */
  private emit<E extends BridgeEvent>(
    event: E,
    ...args: Parameters<BridgeEventCallbacks[E]>
  ): void {
    if (this.eventListeners[event]) {
      for (const callback of this.eventListeners[event]!) {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      }
    }
  }
}

// Export enums
export { MessageType, ServerStatus } from "./types";
// Export types
export type { MessageData, FastAgentConfig, FastAgentMessage, BridgeEvent, BridgeEventCallbacks } from "./types";
