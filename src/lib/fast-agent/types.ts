/**
 * Fast-Agent Types
 *
 * This file contains type definitions for the Fast-Agent bridge.
 */

/**
 * Message types enum for the Fast-Agent protocol
 */
export enum MessageType {
  INITIALIZE = "initialize",
  INITIALIZED = "initialized",
  USER_MESSAGE = "user_message",
  ASSISTANT_MESSAGE = "assistant_message",
  SYSTEM_MESSAGE = "system_message",
  ERROR = "error",
  STATUS = "status",
  TOOL_REQUEST = "tool_request",
  TOOL_RESPONSE = "tool_response",
  SHUTDOWN = "shutdown",
  PING = "ping",
  PONG = "pong",
  THINKING_STARTED = "thinking_started",
  THINKING_COMPLETE = "thinking_complete",
  REQUEST_HISTORY = "request_history",
  HISTORY_RESPONSE = "history_response",
  CONNECTION_ESTABLISHED = "connection_established",
}

/**
 * Message data type for the Fast-Agent protocol
 */
export interface MessageData {
  content?: string;
  message_id?: string;
  in_response_to?: string;
  client_id?: string;
  timestamp?: number;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  capabilities?: string[];
  history?: FastAgentMessage[];
  server_info?: {
    name: string;
    version: string;
  };
  client_info?: {
    name: string;
  };
  [key: string]: any;
}

/**
 * Base interface for all Fast-Agent messages
 */
export interface FastAgentMessage {
  type: string;
  messageId: string;
  data?: MessageData;
  timestamp: string;
}

/**
 * Fast-Agent server status
 */
export enum ServerStatus {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  ERROR = "error",
}

/**
 * Fast-Agent Bridge Events
 */
export type BridgeEvent = "connect" | "disconnect" | "error" | "message" | "history";

/**
 * Fast-Agent Bridge Event Callbacks
 */
export type BridgeEventCallbacks = {
  connect: () => void;
  disconnect: () => void;
  error: (error: Error) => void;
  message: (message: FastAgentMessage) => void;
  history: (messages: FastAgentMessage[]) => void;
};

/**
 * Fast-Agent Bridge configuration
 */
export interface FastAgentConfig {
  url?: string;
  clientId?: string;
  reconnect?: boolean;
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}
