/**
 * Fast-Agent Bridge Tests
 */

import {
  FastAgentBridge,
  FastAgentMessage,
  MessageType,
  ServerStatus,
} from "../bridge";

/**
 * Mock WebSocket implementation for testing
 */
class MockWebSocket {
  onopen: ((this: WebSocket, ev: Event) => any) | null = null;
  onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null;
  onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null = null;
  onerror: ((this: WebSocket, ev: Event) => any) | null = null;
  readyState = 0; // WebSocket.CONNECTING

  constructor(public url: string) {
    // Simulate connection after short delay
    setTimeout(() => {
      this.readyState = 1; // WebSocket.OPEN
      if (this.onopen) this.onopen(new Event("open"));
    }, 50);
  }

  send(data: string): void {
    try {
      const message = JSON.parse(data);

      // Simulate response for message types
      if (message.type === MessageType.INITIALIZE) {
        this.simulateResponse({
          type: MessageType.INITIALIZED,
          messageId: "server-" + Date.now(),
          timestamp: new Date().toISOString(),
          data: {
            capabilities: ["text_generation", "image_analysis", "code_completion"],
          },
        });
      } else if (message.type === MessageType.USER_MESSAGE) {
        // Simulate thinking started
        this.simulateResponse({
          type: MessageType.THINKING_STARTED,
          messageId: "server-thinking-" + Date.now(),
          timestamp: new Date().toISOString(),
          data: {
            message_id: message.messageId,
          },
        });

        // Simulate assistant response after delay
        setTimeout(() => {
          this.simulateResponse({
            type: MessageType.ASSISTANT_MESSAGE,
            messageId: "server-response-" + Date.now(),
            timestamp: new Date().toISOString(),
            data: {
              content: `You said: ${message.data?.content || ""}`,
              in_response_to: message.messageId,
            },
          });

          // Simulate thinking complete
          this.simulateResponse({
            type: MessageType.THINKING_COMPLETE,
            messageId: "server-thinking-complete-" + Date.now(),
            timestamp: new Date().toISOString(),
            data: {
              message_id: message.messageId,
            },
          });
        }, 100);
      } else if (message.type === MessageType.REQUEST_HISTORY) {
        // Simulate history response
        this.simulateResponse({
          type: MessageType.HISTORY_RESPONSE,
          messageId: "server-history-" + Date.now(),
          timestamp: new Date().toISOString(),
          data: {
            history: [
              {
                type: MessageType.USER_MESSAGE,
                messageId: "past-message-1",
                timestamp: new Date(Date.now() - 10000).toISOString(),
                data: { content: "Past message" },
              },
              {
                type: MessageType.ASSISTANT_MESSAGE,
                messageId: "past-message-2",
                timestamp: new Date(Date.now() - 5000).toISOString(),
                data: { content: "Past response" },
              },
            ],
          },
        });
      } else if (message.type === MessageType.TOOL_RESPONSE) {
        // Simulate tool response
        this.simulateResponse({
          type: MessageType.ASSISTANT_MESSAGE,
          messageId: "server-tool-response-" + Date.now(),
          timestamp: new Date().toISOString(),
          data: {
            content: "Tool response processed",
          },
        });
      }
    } catch (error) {
      console.error("Error in mock WebSocket send:", error);
    }
  }

  close(): void {
    this.readyState = 3; // WebSocket.CLOSED
    if (this.onclose) this.onclose(new CloseEvent("close"));
  }

  // Helper to simulate incoming messages
  simulateResponse(message: FastAgentMessage): void {
    if (this.onmessage) {
      const event = {
        data: JSON.stringify(message),
      } as MessageEvent;
      this.onmessage(event);
    }
  }
}

// Replace global WebSocket with our mock for testing
global.WebSocket = MockWebSocket as any;

describe("FastAgentBridge", () => {
  let bridge: FastAgentBridge;
  
  beforeEach(() => {
    bridge = new FastAgentBridge({
      url: "ws://localhost:8000/ws"
    });
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    bridge.disconnect();
  });
  
  test("bridge should initialize with correct default values", () => {
    expect(bridge.getStatus()).toBe(ServerStatus.DISCONNECTED);
    expect(bridge.isConnected()).toBe(false);
  });
  
  test("bridge should expose useful methods", () => {
    expect(typeof bridge.connect).toBe("function");
    expect(typeof bridge.disconnect).toBe("function");
    expect(typeof bridge.isConnected).toBe("function");
    expect(typeof bridge.getStatus).toBe("function");
    expect(typeof bridge.sendMessage).toBe("function");
    expect(typeof bridge.on).toBe("function");
    expect(typeof bridge.off).toBe("function");
  });
  
  test("should connect to the server", async () => {
    // Act
    await bridge.connect();
    
    // Assert
    expect(bridge.isConnected()).toBe(true);
    expect(bridge.getStatus()).toBe(ServerStatus.CONNECTED);
  });
  
  test("should disconnect from the server", async () => {
    // Arrange
    await bridge.connect();
    
    // Act
    bridge.disconnect();
    
    // Assert
    expect(bridge.isConnected()).toBe(false);
    expect(bridge.getStatus()).toBe(ServerStatus.DISCONNECTED);
  });
  
  test("should send and receive messages", async () => {
    // Arrange
    await bridge.connect();
    
    // Set up a listener for messages
    const receivedMessages: FastAgentMessage[] = [];
    bridge.on("message", (message) => {
      receivedMessages.push(message);
    });
    
    // Act
    await bridge.sendMessage(MessageType.USER_MESSAGE, { content: "Hello, agent!" });
    
    // Wait for messages to be processed
    await new Promise((resolve) => setTimeout(resolve, 200));
    
    // Assert - should receive thinking_started, assistant_message, thinking_complete
    expect(receivedMessages.length).toBeGreaterThanOrEqual(3);
    expect(receivedMessages.some(m => m.type === MessageType.THINKING_STARTED)).toBe(true);
    expect(receivedMessages.some(m => m.type === MessageType.ASSISTANT_MESSAGE)).toBe(true);
    expect(receivedMessages.some(m => m.type === MessageType.THINKING_COMPLETE)).toBe(true);
  });
  
  test("should request and receive message history", async () => {
    // Arrange
    await bridge.connect();
    
    // Set up a listener for history
    let historyReceived: FastAgentMessage[] | null = null;
    bridge.on("history", (messages) => {
      historyReceived = messages;
    });
    
    // Act
    await bridge.sendMessage(MessageType.REQUEST_HISTORY);
    
    // Wait for messages to be processed
    await new Promise((resolve) => setTimeout(resolve, 200));
    
    // Assert
    expect(historyReceived).not.toBeNull();
    expect(historyReceived?.length).toBeGreaterThanOrEqual(2);
  });
  
  test("should handle event listeners", () => {
    // Arrange
    const connectListener = jest.fn();
    const disconnectListener = jest.fn();
    const messageListener = jest.fn();
    
    bridge.on("connect", connectListener);
    bridge.on("disconnect", disconnectListener);
    bridge.on("message", messageListener);
    
    // Act
    bridge.connect();
    
    // Wait for connection
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        // Assert
        expect(connectListener).toHaveBeenCalled();
        
        // Clean up
        bridge.off("connect", connectListener);
        bridge.off("disconnect", disconnectListener);
        bridge.off("message", messageListener);
        
        resolve();
      }, 100);
    });
  });
  
  test("should queue messages when not connected", async () => {
    // Act
    await bridge.sendMessage(MessageType.USER_MESSAGE, { content: "Queued message" });
    
    // Assert - the bridge should automatically attempt to connect
    expect(bridge.getStatus()).toBe(ServerStatus.CONNECTING);
    
    // Wait for connection and message processing
    await new Promise((resolve) => setTimeout(resolve, 200));
    
    // Verify connection was established
    expect(bridge.isConnected()).toBe(true);
    expect(bridge.getStatus()).toBe(ServerStatus.CONNECTED);
  });
});
