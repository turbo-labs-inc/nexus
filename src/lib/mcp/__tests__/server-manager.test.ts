import { MCPServerManager } from "../server/manager";
import { MCPServerConfig, MCPCapability, MCPServerStatus, MCPServerConnectionEvent } from "../types";

// Mock WebSocket client
jest.mock("../server/ws-client", () => {
  return {
    MCPWebSocketClient: jest.fn().mockImplementation(() => {
      let connected = false;
      let eventListeners: Array<(event: MCPServerConnectionEvent) => void> = [];
      
      return {
        connect: jest.fn().mockImplementation(async () => {
          connected = true;
          eventListeners.forEach((listener) => {
            listener({
              type: "status_change",
              serverId: "test-server-1",
              timestamp: new Date(),
              status: "online",
            });
          });
          return true;
        }),
        disconnect: jest.fn().mockImplementation(() => {
          connected = false;
          eventListeners.forEach((listener) => {
            listener({
              type: "disconnected",
              serverId: "test-server-1",
              timestamp: new Date(),
              reason: "user_initiated",
            });
          });
        }),
        isConnected: jest.fn().mockImplementation(() => connected),
        addEventListener: jest.fn().mockImplementation((listener) => {
          eventListeners.push(listener);
        }),
        removeEventListener: jest.fn().mockImplementation((listener) => {
          eventListeners = eventListeners.filter((l) => l !== listener);
        }),
        sendMessage: jest.fn().mockImplementation((message) => {
          // Mock response for tool execution
          if (message.type === "tool_execution") {
            setTimeout(() => {
              eventListeners.forEach((listener) => {
                listener({
                  type: "tool_result",
                  serverId: "test-server-1",
                  requestId: message.requestId,
                  timestamp: new Date(),
                  result: {
                    success: true,
                    result: { data: "Test result" },
                  },
                });
              });
            }, 100);
          }
          
          // Mock response for resource query
          if (message.type === "resource_query") {
            setTimeout(() => {
              eventListeners.forEach((listener) => {
                listener({
                  type: "resource_result",
                  serverId: "test-server-1",
                  requestId: message.requestId,
                  timestamp: new Date(),
                  result: {
                    success: true,
                    result: { items: ["item1", "item2"] },
                  },
                });
              });
            }, 100);
          }
          
          // Mock response for prompt rendering
          if (message.type === "prompt_rendering") {
            setTimeout(() => {
              eventListeners.forEach((listener) => {
                listener({
                  type: "prompt_result",
                  serverId: "test-server-1",
                  requestId: message.requestId,
                  timestamp: new Date(),
                  result: {
                    success: true,
                    renderedPrompt: "Test prompt with variables",
                  },
                });
              });
            }, 100);
          }
        }),
      };
    }),
  };
});

describe("MCPServerManager", () => {
  let manager: MCPServerManager;
  
  // Sample test data
  const testServer: MCPServerConfig = {
    id: "test-server-1",
    name: "Test Server",
    url: "ws://localhost:8080",
    capabilities: [
      {
        id: "test-tool-1",
        name: "Test Tool",
        type: "tool",
        description: "A test tool",
        schema: {},
      },
      {
        id: "test-resource-1",
        name: "Test Resource",
        type: "resource",
        description: "A test resource",
        schema: {},
      },
      {
        id: "test-prompt-1",
        name: "Test Prompt",
        type: "prompt",
        description: "A test prompt",
        schema: {},
      },
    ],
    version: "1.0.0",
    status: "unknown",
  };
  
  beforeEach(() => {
    // Create a fresh instance for each test
    manager = new MCPServerManager();
    jest.clearAllMocks();
  });
  
  test("should register a server", () => {
    // Act
    manager.registerServer(testServer);
    
    // Assert
    expect(manager.getServers().length).toBe(1);
    expect(manager.getServer(testServer.id)).toEqual(testServer);
    
    // Check capabilities
    const capabilities = manager.getAllCapabilities();
    expect(capabilities.length).toBe(3);
    expect(capabilities.some(c => c.id === "test-tool-1")).toBe(true);
    expect(capabilities.some(c => c.id === "test-resource-1")).toBe(true);
    expect(capabilities.some(c => c.id === "test-prompt-1")).toBe(true);
  });
  
  test("should unregister a server", () => {
    // Arrange
    manager.registerServer(testServer);
    
    // Act
    manager.unregisterServer(testServer.id);
    
    // Assert
    expect(manager.getServers().length).toBe(0);
    expect(manager.getServer(testServer.id)).toBeUndefined();
    expect(manager.getAllCapabilities().length).toBe(0);
  });
  
  test("should connect to a server", async () => {
    // Arrange
    manager.registerServer(testServer);
    
    // Act
    const result = await manager.connectToServer(testServer.id);
    
    // Assert
    expect(result).toBe(true);
    
    // Check status
    const status = manager.getServerStatus(testServer.id);
    expect(status?.status).toBe("online");
  });
  
  test("should disconnect from a server", async () => {
    // Arrange
    manager.registerServer(testServer);
    await manager.connectToServer(testServer.id);
    
    // Act
    await manager.disconnectFromServer(testServer.id);
    
    // Assert
    const status = manager.getServerStatus(testServer.id);
    expect(status?.status).toBe("offline");
  });
  
  test("should execute a tool", async () => {
    // Arrange
    manager.registerServer(testServer);
    await manager.connectToServer(testServer.id);
    
    // Act
    const result = await manager.executeTool("test-tool-1", { param: "value" });
    
    // Assert
    expect(result.success).toBe(true);
    expect(result.result).toEqual({ data: "Test result" });
  });
  
  test("should query a resource", async () => {
    // Arrange
    manager.registerServer(testServer);
    await manager.connectToServer(testServer.id);
    
    // Act
    const result = await manager.queryResource("test-resource-1", { query: "test" });
    
    // Assert
    expect(result.success).toBe(true);
    expect(result.result).toEqual({ items: ["item1", "item2"] });
  });
  
  test("should render a prompt", async () => {
    // Arrange
    manager.registerServer(testServer);
    await manager.connectToServer(testServer.id);
    
    // Act
    const result = await manager.renderPrompt("test-prompt-1", { variable: "value" });
    
    // Assert
    expect(result.success).toBe(true);
    expect(result.renderedPrompt).toBe("Test prompt with variables");
  });
  
  test("should filter capabilities by type", () => {
    // Arrange
    manager.registerServer(testServer);
    
    // Act
    const tools = manager.getCapabilitiesByType("tool");
    const resources = manager.getCapabilitiesByType("resource");
    const prompts = manager.getCapabilitiesByType("prompt");
    
    // Assert
    expect(tools.length).toBe(1);
    expect(tools[0].id).toBe("test-tool-1");
    
    expect(resources.length).toBe(1);
    expect(resources[0].id).toBe("test-resource-1");
    
    expect(prompts.length).toBe(1);
    expect(prompts[0].id).toBe("test-prompt-1");
  });
  
  test("should filter capabilities by server", () => {
    // Arrange
    manager.registerServer(testServer);
    
    // Act
    const capabilities = manager.getCapabilitiesByServer(testServer.id);
    
    // Assert
    expect(capabilities.length).toBe(3);
  });
  
  test("should handle server event listeners", () => {
    // Arrange
    const eventListener = jest.fn();
    manager.addEventListener(eventListener);
    
    // Act
    manager.registerServer(testServer);
    
    // Assert
    expect(eventListener).toHaveBeenCalledWith(expect.objectContaining({
      type: "status_change",
      serverId: testServer.id,
    }));
    
    // Remove listener
    manager.removeEventListener(eventListener);
    
    // Register another server
    const testServer2 = { ...testServer, id: "test-server-2", name: "Test Server 2" };
    manager.registerServer(testServer2);
    
    // The removed listener should not be called again
    expect(eventListener).toHaveBeenCalledTimes(1);
  });
});