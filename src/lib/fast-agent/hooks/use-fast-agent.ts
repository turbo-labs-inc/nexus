/**
 * React hook for the Fast-Agent Bridge
 */
import { useState, useCallback, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

import {
  FastAgentBridge,
  FastAgentMessage,
  FastAgentConfig,
  MessageType,
  MessageData,
  ServerStatus,
} from "../bridge";

/**
 * Hook return type
 */
type UseFastAgentReturn = {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  hasError: boolean;
  errorMessage?: string;

  // Messages
  messages: FastAgentMessage[];
  isThinking: boolean;

  // Actions
  connect: (config?: Partial<FastAgentConfig>) => Promise<void>;
  disconnect: () => void;
  sendMessage: (content: string, options?: any) => Promise<void>;
  clearMessages: () => void;
  requestHistory: () => Promise<void>;
};

const DEFAULT_CONFIG: FastAgentConfig = {
  url: "ws://localhost:8000/ws",
  reconnect: true,
  maxRetries: 3,
  retryDelay: 1000,
};

/**
 * React hook for interacting with the Fast-Agent Bridge
 */
export function useFastAgent(initialConfig?: Partial<FastAgentConfig>): UseFastAgentReturn {
  // Merge default config with provided config
  const config = { ...DEFAULT_CONFIG, ...initialConfig };

  // Create a ref for the bridge to persist across renders
  const bridgeRef = useRef<FastAgentBridge | null>(null);

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [messages, setMessages] = useState<FastAgentMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);

  // Initialize bridge on first render if not already initialized
  useEffect(() => {
    if (!bridgeRef.current) {
      bridgeRef.current = new FastAgentBridge(config);
    }

    return () => {
      // Clean up on unmount
      if (bridgeRef.current && bridgeRef.current.isConnected()) {
        bridgeRef.current.disconnect();
      }
    };
  }, []);

  // Set up event listeners
  useEffect(() => {
    const bridge = bridgeRef.current;
    if (!bridge) return;

    const handleConnect = () => {
      setIsConnected(true);
      setIsConnecting(false);
      setHasError(false);
      setErrorMessage(undefined);
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setIsConnecting(false);
    };

    const handleError = (error: Error) => {
      setHasError(true);
      setErrorMessage(error.message);
      setIsConnecting(false);
    };

    const handleMessage = (message: FastAgentMessage) => {
      setMessages((prevMessages) => [...prevMessages, message]);

      // Handle thinking state
      if (message.type === MessageType.THINKING_STARTED) {
        setIsThinking(true);
      } else if (message.type === MessageType.THINKING_COMPLETE) {
        setIsThinking(false);
      }
    };

    const handleHistoryResponse = (history: FastAgentMessage[]) => {
      setMessages(history);
    };

    // Subscribe to events
    bridge.on("connect", handleConnect);
    bridge.on("disconnect", handleDisconnect);
    bridge.on("error", handleError);
    bridge.on("message", handleMessage);
    bridge.on("history", handleHistoryResponse);

    return () => {
      // Unsubscribe from events
      bridge.off("connect", handleConnect);
      bridge.off("disconnect", handleDisconnect);
      bridge.off("error", handleError);
      bridge.off("message", handleMessage);
      bridge.off("history", handleHistoryResponse);
    };
  }, []);

  // Connect to the Fast-Agent server
  const connect = useCallback(
    async (connectionConfig?: Partial<FastAgentConfig>) => {
      const bridge = bridgeRef.current;
      if (!bridge) return;
      
      // Don't try to reconnect if already connecting
      if (isConnecting) return;
      
      // Don't try to reconnect if already connected
      if (bridge.isConnected()) return;

      try {
        setIsConnecting(true);
        setHasError(false);
        setErrorMessage(undefined);

        const mergedConfig = { ...config, ...connectionConfig };
        
        // Set a timeout to prevent too many connection attempts
        const connectPromise = bridge.connect(mergedConfig);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Connection timeout")), 5000);
        });
        
        await Promise.race([connectPromise, timeoutPromise]);

        // The connect event handler will update state
      } catch (error) {
        setIsConnecting(false);
        setHasError(true);
        setErrorMessage((error as Error).message);
      }
    },
    [config, isConnecting]
  );

  // Disconnect from the Fast-Agent server
  const disconnect = useCallback(() => {
    const bridge = bridgeRef.current;
    if (!bridge) return;

    bridge.disconnect();
    // The disconnect event handler will update state
  }, []);

  // Send a message to the Fast-Agent
  const sendMessage = useCallback(
    async (content: string, options?: any) => {
      const bridge = bridgeRef.current;
      if (!bridge || !isConnected) {
        throw new Error("Not connected to Fast-Agent server");
      }

      const messageId = uuidv4();
      const messageData: MessageData = {
        content,
        ...options,
      };

      // Add message to local state immediately
      const userMessage: FastAgentMessage = {
        type: MessageType.USER_MESSAGE,
        messageId,
        data: messageData,
        timestamp: new Date().toISOString(),
      };

      setMessages((prevMessages) => [...prevMessages, userMessage]);

      // Send to server
      await bridge.sendMessage(MessageType.USER_MESSAGE, messageData, messageId);
    },
    [isConnected]
  );

  // Clear all messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Request message history
  const requestHistory = useCallback(async () => {
    const bridge = bridgeRef.current;
    if (!bridge || !isConnected) {
      throw new Error("Not connected to Fast-Agent server");
    }

    await bridge.sendMessage(MessageType.REQUEST_HISTORY);
    // The history event handler will update the messages
  }, [isConnected]);

  return {
    isConnected,
    isConnecting,
    hasError,
    errorMessage,
    messages,
    isThinking,
    connect,
    disconnect,
    sendMessage,
    clearMessages,
    requestHistory,
  };
}
