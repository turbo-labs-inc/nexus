"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFastAgentTools, FastAgentTool, ToolResponse } from "@/lib/fast-agent";
import { MessageType } from "@/lib/fast-agent";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Sample tool definitions
const DEMO_TOOLS: FastAgentTool[] = [
  {
    id: "weather_tool",
    name: "GetWeather",
    description: "Get the current weather for a location",
    parameters: [
      {
        type: "string",
        name: "location",
        description: "The city and state or country",
        required: true,
      }
    ]
  },
  {
    id: "calculator_tool",
    name: "Calculate",
    description: "Perform a calculation",
    parameters: [
      {
        type: "string",
        name: "expression",
        description: "The mathematical expression to evaluate",
        required: true,
      }
    ]
  }
];

export interface FastAgentToolsDemoProps {
  serverUrl?: string;
  autoConnect?: boolean;
}

export function FastAgentToolsDemo({ 
  serverUrl = "ws://localhost:8000/ws",
  autoConnect = true
}: FastAgentToolsDemoProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [activeTool, setActiveTool] = useState<FastAgentTool | null>(null);
  const [toolParams, setToolParams] = useState<Record<string, string>>({});
  
  const {
    isConnected,
    isConnecting,
    hasError,
    errorMessage,
    messages,
    isThinking,
    availableTools,
    registerTool,
    unregisterTool,
    handleToolResponse,
    connect,
    disconnect,
    sendMessage,
    clearMessages
  } = useFastAgentTools(serverUrl);
  
  // Register demo tools when connected
  useEffect(() => {
    if (isConnected) {
      // Register demo tools
      DEMO_TOOLS.forEach(tool => registerTool(tool));
    }
  }, [isConnected, registerTool]);
  
  // Auto-connect when component mounts
  useEffect(() => {
    if (autoConnect) {
      handleConnect();
    }
  }, [autoConnect]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Handle tool requests
  useEffect(() => {
    const toolRequests = messages.filter(
      (msg) => msg.type === MessageType.TOOL_REQUEST && msg.data?.tool
    );
    
    if (toolRequests.length > 0) {
      // Take the most recent tool request
      const latestRequest = toolRequests[toolRequests.length - 1];
      const toolId = latestRequest.data.tool.id;
      const toolName = latestRequest.data.tool.name;
      
      // Find the requested tool
      const tool = DEMO_TOOLS.find(t => t.id === toolId || t.name === toolName);
      if (tool) {
        setActiveTool(tool);
        
        // Initialize parameters from request if available
        if (latestRequest.data.tool.arguments) {
          setToolParams(latestRequest.data.tool.arguments);
        } else {
          // Reset parameters
          const initialParams: Record<string, string> = {};
          tool.parameters.forEach(param => {
            initialParams[param.name] = "";
          });
          setToolParams(initialParams);
        }
      }
    }
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error("Failed to connect to Fast-Agent:", error);
    }
  };
  
  const handleDisconnect = () => {
    disconnect();
  };
  
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !isConnected) return;
    
    try {
      await sendMessage(inputValue);
      setInputValue("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };
  
  const handleSubmitToolResponse = async () => {
    if (!activeTool || !isConnected) return;
    
    try {
      // Simple simulation of tool execution
      let result;
      
      if (activeTool.id === "weather_tool") {
        const location = toolParams.location;
        result = `Weather for ${location}: Sunny, 75°F (24°C)`;
      } else if (activeTool.id === "calculator_tool") {
        const expression = toolParams.expression;
        // Very basic calculator - in real code, use a proper eval alternative
        // eslint-disable-next-line no-eval
        result = `Result: ${eval(expression)}`;
      } else {
        result = "Tool executed successfully";
      }
      
      const response: ToolResponse = {
        id: activeTool.id,
        name: activeTool.name,
        result
      };
      
      await handleToolResponse(response);
      setActiveTool(null);
      setToolParams({});
    } catch (error) {
      console.error("Failed to submit tool response:", error);
    }
  };
  
  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const getConnectionStatusColor = () => {
    if (hasError) return "destructive";
    if (isConnected) return "success";
    if (isConnecting) return "warning";
    return "secondary";
  };
  
  const getConnectionStatusText = () => {
    if (hasError) return "Error";
    if (isConnected) return "Connected";
    if (isConnecting) return "Connecting...";
    return "Disconnected";
  };
  
  return (
    <Card className="mx-auto w-full max-w-3xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Fast-Agent Tools Demo</CardTitle>
          {isConnected && (
            <p className="mt-1 text-xs text-muted-foreground">
              Connected to server at {serverUrl} | {availableTools.length} tools registered
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getConnectionStatusColor() as any}>{getConnectionStatusText()}</Badge>
          {isConnected ? (
            <Button variant="outline" size="sm" onClick={handleDisconnect}>
              Disconnect
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handleConnect} disabled={isConnecting}>
              Connect
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={clearMessages}>
            Clear
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4 h-[400px] overflow-y-auto rounded-md border p-4">
          {messages.length === 0 ? (
            <div className="flex h-full items-center justify-center text-center text-muted-foreground">
              <p>No messages yet. Start a conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                // Skip certain message types from the UI
                if (
                  message.type === MessageType.PING || 
                  message.type === MessageType.PONG ||
                  message.type === MessageType.THINKING_STARTED ||
                  message.type === MessageType.THINKING_COMPLETE ||
                  message.type === MessageType.CONNECTION_ESTABLISHED ||
                  message.type === MessageType.INITIALIZED ||
                  message.type === MessageType.REQUEST_HISTORY ||
                  message.type === MessageType.HISTORY_RESPONSE ||
                  message.type === MessageType.TOOL_REQUEST
                ) {
                  return null;
                }
                
                const isUser = message.type === MessageType.USER_MESSAGE;
                const isTool = message.type === MessageType.TOOL_RESPONSE;
                const content = message.data?.content || 
                  (isTool && message.data?.tool?.result ? `Tool result: ${message.data.tool.result}` : "");
                
                return (
                  <div 
                    key={message.messageId} 
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div 
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        isUser 
                          ? "bg-primary text-primary-foreground" 
                          : isTool
                            ? "bg-blue-100 dark:bg-blue-900"
                            : "bg-muted"
                      }`}
                    >
                      {isTool && (
                        <div className="mb-1 text-xs text-muted-foreground">
                          Tool: {message.data?.tool?.name}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{content}</p>
                    </div>
                  </div>
                );
              })}
              {isThinking && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg bg-muted px-4 py-2">
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"></div>
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                      <div
                        className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground"
                        style={{ animationDelay: "0.4s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {hasError && (
          <div className="mb-2 text-sm text-destructive">
            {errorMessage || "An error occurred."}
          </div>
        )}
        
        {/* Tool Execution UI */}
        {activeTool && (
          <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
            <h3 className="mb-2 font-medium">Tool Request: {activeTool.name}</h3>
            <p className="mb-3 text-sm text-muted-foreground">{activeTool.description}</p>
            
            <div className="mb-4 space-y-3">
              {activeTool.parameters.map((param) => (
                <div key={param.name}>
                  <Label htmlFor={param.name}>
                    {param.name}{param.required ? " (required)" : ""}
                  </Label>
                  <Input
                    id={param.name}
                    placeholder={param.description}
                    value={toolParams[param.name] || ""}
                    onChange={(e) => 
                      setToolParams(prev => ({ ...prev, [param.name]: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setActiveTool(null)}
              >
                Cancel
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleSubmitToolResponse}
                disabled={
                  activeTool.parameters
                    .filter(p => p.required)
                    .some(p => !toolParams[p.name])
                }
              >
                Submit Response
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <div className="flex w-full items-end gap-2">
          <Textarea 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Type your message..."
            className="min-h-[80px] flex-1"
            disabled={!isConnected}
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!isConnected || !inputValue.trim()}
            className="shrink-0"
          >
            Send
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}