# Fast-Agent Bridge Chat Implementation

This document outlines the implementation of a bridge chat component that connects the multimodal chat UI with Fast-Agent for MCP capabilities. The implementation follows a modular approach, allowing the chat interface to communicate with MCP servers through Fast-Agent.

## Overview

The Fast-Agent bridge serves as the middleware between our Next.js frontend and the MCP servers. It handles:

1. Message routing between the UI and Fast-Agent
2. Multimodal content processing (text, images, audio)
3. Agent workflow orchestration
4. MCP server communication

## Implementation Architecture

The implementation follows a client-server architecture:

1. **Client-side (Next.js)**: Handles UI rendering, user interactions, and WebSocket communication
2. **Server-side (Next.js API routes)**: Manages Fast-Agent integration, MCP server connections, and message processing

## Server-Side Implementation

### 1. Fast-Agent Integration Module

```typescript
// src/lib/fast-agent/index.ts
import { spawn } from "child_process";
import { createReadStream, createWriteStream } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export interface FastAgentConfig {
  model: string;
  instruction: string;
  servers?: string[];
  humanInput?: boolean;
}

export interface FastAgentMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string | Array<{ type: string; data: any }>;
  timestamp: number;
}

export class FastAgentBridge {
  private agentProcess: any;
  private messageQueue: Array<(message: FastAgentMessage) => void> = [];
  private config: FastAgentConfig;
  private sessionId: string;
  private logPath: string;

  constructor(config: FastAgentConfig) {
    this.config = config;
    this.sessionId = uuidv4();
    this.logPath = path.join(process.cwd(), "logs", `${this.sessionId}.log`);
  }

  async initialize(): Promise<void> {
    // Create a temporary Python script to run Fast-Agent
    const scriptPath = path.join(process.cwd(), "tmp", `${this.sessionId}.py`);
    const scriptContent = this.generateAgentScript();

    // Write the script to a file
    await this.writeFile(scriptPath, scriptContent);

    // Spawn the Fast-Agent process
    this.agentProcess = spawn("uv", ["run", scriptPath, "--model", this.config.model]);

    // Handle process output
    this.agentProcess.stdout.on("data", (data: Buffer) => {
      this.handleAgentOutput(data.toString());
    });

    this.agentProcess.stderr.on("data", (data: Buffer) => {
      console.error(`Fast-Agent Error: ${data.toString()}`);
    });

    this.agentProcess.on("close", (code: number) => {
      console.log(`Fast-Agent process exited with code ${code}`);
    });

    // Wait for the agent to initialize
    return new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  }

  async sendMessage(
    message: string,
    attachments?: Array<{ type: string; data: any }>
  ): Promise<FastAgentMessage> {
    return new Promise((resolve) => {
      // Add the callback to the queue
      this.messageQueue.push(resolve);

      // Format the message with attachments if any
      let formattedMessage = message;
      if (attachments && attachments.length > 0) {
        // Handle attachments based on type
        attachments.forEach((attachment) => {
          if (attachment.type === "image") {
            // Save the image to a temporary file and reference it
            const imagePath = path.join(process.cwd(), "tmp", `${uuidv4()}.png`);
            this.saveBase64Image(attachment.data, imagePath);
            formattedMessage += `\n[Image: ${imagePath}]`;
          } else if (attachment.type === "audio") {
            // Similar handling for audio
            const audioPath = path.join(process.cwd(), "tmp", `${uuidv4()}.mp3`);
            this.saveBase64Audio(attachment.data, audioPath);
            formattedMessage += `\n[Audio: ${audioPath}]`;
          }
        });
      }

      // Send the message to the agent
      this.agentProcess.stdin.write(formattedMessage + "\n");
    });
  }

  async shutdown(): Promise<void> {
    if (this.agentProcess) {
      this.agentProcess.kill();
    }
  }

  private handleAgentOutput(output: string): void {
    // Parse the output to extract the agent's response
    const response: FastAgentMessage = {
      id: uuidv4(),
      role: "assistant",
      content: output.trim(),
      timestamp: Date.now(),
    };

    // Resolve the oldest promise in the queue
    const callback = this.messageQueue.shift();
    if (callback) {
      callback(response);
    }
  }

  private generateAgentScript(): string {
    return `
import asyncio
from mcp_agent.core.fastagent import FastAgent

# Create the application
fast = FastAgent("Bridge Agent")

@fast.agent(
  instruction="${this.config.instruction}",
  ${this.config.servers ? `servers=["${this.config.servers.join('", "')}"],` : ""}
  ${this.config.humanInput ? "human_input=True," : ""}
)
async def main():
  async with fast.run() as agent:
    await agent.interactive()

if __name__ == "__main__":
    asyncio.run(main())
`;
  }

  private async writeFile(filePath: string, content: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const stream = createWriteStream(filePath);
      stream.write(content);
      stream.end();
      stream.on("finish", resolve);
      stream.on("error", reject);
    });
  }

  private saveBase64Image(base64Data: string, filePath: string): void {
    const data = base64Data.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(data, "base64");
    require("fs").writeFileSync(filePath, buffer);
  }

  private saveBase64Audio(base64Data: string, filePath: string): void {
    const data = base64Data.replace(/^data:audio\/\w+;base64,/, "");
    const buffer = Buffer.from(data, "base64");
    require("fs").writeFileSync(filePath, buffer);
  }
}
```

### 2. API Route for Chat

```typescript
// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { FastAgentBridge, FastAgentConfig } from "@/lib/fast-agent";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Store active agent instances
const activeAgents: Record<string, FastAgentBridge> = {};

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { message, attachments, config } = await req.json();

    // Get or create an agent instance for this user
    let agent = activeAgents[userId];
    if (!agent) {
      const agentConfig: FastAgentConfig = config || {
        model: "gpt-4o",
        instruction:
          "You are a helpful assistant that can process text, images, and other media to provide accurate and helpful responses.",
        humanInput: true,
      };

      agent = new FastAgentBridge(agentConfig);
      await agent.initialize();
      activeAgents[userId] = agent;
    }

    // Send the message to the agent
    const response = await agent.sendMessage(message, attachments);

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in chat API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Cleanup function for when the server shuts down
process.on("SIGTERM", async () => {
  for (const userId in activeAgents) {
    await activeAgents[userId].shutdown();
  }
});
```

### 3. WebSocket Handler for Real-time Communication

```typescript
// src/app/api/chat/socket/route.ts
import { NextRequest } from "next/server";
import { FastAgentBridge, FastAgentConfig } from "@/lib/fast-agent";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Store active WebSocket connections and agent instances
const activeConnections: Record<string, any> = {};
const activeAgents: Record<string, FastAgentBridge> = {};

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const userId = session.user.id;

    // Handle WebSocket upgrade
    const { socket, response } = await new Promise<any>((resolve) => {
      const upgradeHandler = (res: any, socket: any, head: any) => {
        resolve({ socket, response: res });
      };

      // @ts-ignore - Server-side only
      req.socket.server.webSocketServer.handleUpgrade(
        req,
        req.socket,
        Buffer.alloc(0),
        upgradeHandler
      );
    });

    // Store the connection
    activeConnections[userId] = socket;

    // Set up message handling
    socket.on("message", async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());

        // Initialize agent if needed
        if (message.type === "init") {
          const agentConfig: FastAgentConfig = message.config || {
            model: "gpt-4o",
            instruction:
              "You are a helpful assistant that can process text, images, and other media to provide accurate and helpful responses.",
            humanInput: true,
          };

          // Create and initialize the agent
          const agent = new FastAgentBridge(agentConfig);
          await agent.initialize();
          activeAgents[userId] = agent;

          socket.send(JSON.stringify({ type: "init_complete" }));
          return;
        }

        // Handle chat messages
        if (message.type === "chat") {
          const agent = activeAgents[userId];
          if (!agent) {
            socket.send(
              JSON.stringify({
                type: "error",
                error: "Agent not initialized",
              })
            );
            return;
          }

          // Send typing indicator
          socket.send(JSON.stringify({ type: "typing", status: true }));

          // Process the message
          const response = await agent.sendMessage(message.content, message.attachments);

          // Send the response
          socket.send(
            JSON.stringify({
              type: "chat",
              message: response,
            })
          );

          // Stop typing indicator
          socket.send(JSON.stringify({ type: "typing", status: false }));
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
        socket.send(
          JSON.stringify({
            type: "error",
            error: "Failed to process message",
          })
        );
      }
    });

    // Handle connection close
    socket.on("close", async () => {
      // Clean up resources
      if (activeAgents[userId]) {
        await activeAgents[userId].shutdown();
        delete activeAgents[userId];
      }
      delete activeConnections[userId];
    });

    return response;
  } catch (error) {
    console.error("WebSocket connection error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
```

## Client-Side Implementation

### 1. Chat Context Provider

```typescript
// src/context/chat-context.tsx
'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '@/context/auth-context';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{ type: string; data: any }>;
  timestamp: number;
}

interface ChatContextType {
  messages: ChatMessage[];
  isTyping: boolean;
  sendMessage: (content: string, attachments?: Array<{ type: string; data: any }>) => Promise<void>;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Initialize WebSocket connection
    const socket = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/chat/socket`);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);

      // Initialize the agent
      socket.send(JSON.stringify({
        type: 'init',
        config: {
          model: 'gpt-4o',
          instruction: 'You are a helpful assistant that can process text, images, and other media to provide accurate and helpful responses.',
          humanInput: true
        }
      }));
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'init_complete') {
        console.log('Agent initialized');
      } else if (data.type === 'typing') {
        setIsTyping(data.status);
      } else if (data.type === 'chat') {
        setMessages((prev) => [...prev, data.message]);
      } else if (data.type === 'error') {
        console.error('Chat error:', data.error);
        // Display error to user
      }
    };

    socket.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Clean up on unmount
    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [user]);

  const sendMessage = async (content: string, attachments?: Array<{ type: string; data: any }>) => {
    if (!isConnected || !socketRef.current) {
      throw new Error('Not connected to chat server');
    }

    // Create a new message
    const message: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: attachments && attachments.length > 0 ? [content, ...attachments] : content,
      timestamp: Date.now()
    };

    // Add to messages
    setMessages((prev) => [...prev, message]);

    // Send via WebSocket
    socketRef.current.send(JSON.stringify({
      type: 'chat',
      content,
      attachments
    }));
  };

  const clearMessages = () => {
    setMessages([]);
  };

  return (
    <ChatContext.Provider value={{ messages, isTyping, sendMessage, clearMessages }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
```

### 2. Chat Component with Fast-Agent Integration

```typescript
// src/components/chat/fast-agent-chat.tsx
'use client';

import React, { useRef, useState } from 'react';
import { useChat, ChatMessage } from '@/context/chat-context';
import { ChatContainer } from '@/components/chat/chat-container';
import { MessageList } from '@/components/chat/message-list';
import { ChatInput } from '@/components/chat/chat-input';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

interface FastAgentChatProps {
  className?: string;
}

export function FastAgentChat({ className }: FastAgentChatProps) {
  const { messages, isTyping, sendMessage, clearMessages } = useChat();
  const [attachments, setAttachments] = useState<Array<{ type: string; data: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = async (text: string, files?: File[]) => {
    try {
      // Process files if any
      const processedAttachments = await Promise.all(
        (files || []).map(async (file) => {
          return new Promise<{ type: string; data: string }>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              const result = e.target?.result as string;
              resolve({
                type: file.type.startsWith('image/')
                  ? 'image'
                  : file.type.startsWith('audio/')
                    ? 'audio'
                    : 'file',
                data: result
              });
            };
            reader.readAsDataURL(file);
          });
        })
      );

      // Send message with attachments
      await sendMessage(text, processedAttachments);

      // Clear attachments after sending
      setAttachments([]);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Show error to user
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const newAttachments = await Promise.all(
      files.map(async (file) => {
        return new Promise<{ type: string; data: string }>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            resolve({
              type: file.type.startsWith('image/')
                ? 'image'
                : file.type.startsWith('audio/')
                  ? 'audio'
                  : 'file',
              data: result
            });
          };
          reader.readAsDataURL(file);
        });
      })
    );

    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <ChatContainer className={className}>
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h2 className="text-lg font-semibold">Fast-Agent Chat</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={clearMessages}
          title="Clear conversation"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <MessageList
        messages={messages.map((msg) => ({
          id: msg.id,
          role: msg.role,
          content: Array.isArray(msg.content)
            ? msg.content
            : [{ type: 'text', data: msg.content }],
          timestamp: msg.timestamp
        }))}
        isLoading={isTyping}
      />

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileSelect}
        multiple
        accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
      />

      <ChatInput
        onSend={handleSendMessage}
        isLoading={isTyping}
        onAttachmentClick={() => fileInputRef.current?.click()}
        attachments={attachments}
        onRemoveAttachment={handleRemoveAttachment}
      />
    </ChatContainer>
  );
}
```

### 3. Chat Page with Fast-Agent Integration

```typescript
// src/app/chat/page.tsx
'use client';

import React from 'react';
import { FastAgentChat } from '@/components/chat/fast-agent-chat';
import { MobileContainer } from '@/components/layout/mobile-container';
import { ChatProvider } from '@/context/chat-context';

export default function ChatPage() {
  return (
    <ChatProvider>
      <MobileContainer>
        <FastAgentChat />
      </MobileContainer>
    </ChatProvider>
  );
}
```

## Python Setup for Fast-Agent

To ensure Fast-Agent works correctly with our Next.js application, we need to set up the Python environment and configuration files.

### 1. Python Environment Setup Script

```typescript
// src/scripts/setup-fast-agent.ts
import { spawn } from "child_process";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import path from "path";

// Paths
const rootDir = process.cwd();
const configDir = path.join(rootDir, "config");
const tmpDir = path.join(rootDir, "tmp");
const logsDir = path.join(rootDir, "logs");

// Create necessary directories
[configDir, tmpDir, logsDir].forEach((dir) => {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
});

// Fast-Agent configuration
const fastAgentConfig = `
# Fast-Agent Configuration
model_providers:
  anthropic:
    api_key: ${process.env.ANTHROPIC_API_KEY || ""}
  openai:
    api_key: ${process.env.OPENAI_API_KEY || ""}

# Default model to use
default_model: gpt-4o

# MCP Servers configuration
servers:
  fetch:
    type: http
    url: http://localhost:8080/fetch
  search:
    type: http
    url: http://localhost:8080/search
  filesystem:
    type: filesystem
    root_dir: ${tmpDir.replace(/\\/g, "/")}
`;

// Write configuration file
writeFileSync(path.join(configDir, "fastagent.config.yaml"), fastAgentConfig);

// Install Fast-Agent
console.log("Installing Fast-Agent...");
const installProcess = spawn("pip", ["install", "fast-agent-mcp"]);

installProcess.stdout.on("data", (data) => {
  console.log(`stdout: ${data}`);
});

installProcess.stderr.on("data", (data) => {
  console.error(`stderr: ${data}`);
});

installProcess.on("close", (code) => {
  console.log(`Fast-Agent installation process exited with code ${code}`);

  if (code === 0) {
    console.log("Fast-Agent installed successfully");

    // Run Fast-Agent setup
    console.log("Setting up Fast-Agent...");
    const setupProcess = spawn("fast-agent", ["setup"]);

    setupProcess.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    setupProcess.stderr.on("data", (data) => {
      console.error(`stderr: ${data}`);
    });

    setupProcess.on("close", (code) => {
      console.log(`Fast-Agent setup process exited with code ${code}`);

      if (code === 0) {
        console.log("Fast-Agent setup completed successfully");
      } else {
        console.error("Fast-Agent setup failed");
      }
    });
  } else {
    console.error("Fast-Agent installation failed");
  }
});
```

### 2. Package.json Script

Add the following script to package.json:

```json
{
  "scripts": {
    "setup-fast-agent": "ts-node src/scripts/setup-fast-agent.ts"
  }
}
```

## Integration Testing

To ensure the Fast-Agent bridge works correctly, we'll create a simple test script:

```typescript
// src/scripts/test-fast-agent-bridge.ts
import { FastAgentBridge } from "@/lib/fast-agent";

async function testFastAgentBridge() {
  console.log("Testing Fast-Agent Bridge...");

  const agent = new FastAgentBridge({
    model: "gpt-4o",
    instruction: "You are a helpful assistant that responds concisely.",
    humanInput: true,
  });

  try {
    console.log("Initializing agent...");
    await agent.initialize();
    console.log("Agent initialized");

    console.log("Sending test message...");
    const response = await agent.sendMessage("Hello, can you tell me what Fast-Agent is?");
    console.log("Response:", response);

    console.log("Shutting down agent...");
    await agent.shutdown();
    console.log("Agent shut down");

    console.log("Test completed successfully");
  } catch (error) {
    console.error("Test failed:", error);
  }
}

testFastAgentBridge();
```

## Deployment Considerations

When deploying the application with Fast-Agent integration, consider the following:

1. **Python Environment**: Ensure the server has Python installed and the necessary permissions to install packages.

2. **API Keys**: Securely store and provide API keys for OpenAI, Anthropic, or other model providers.

3. **File System Access**: The application needs permission to create and manage temporary files for multimodal content.

4. **Process Management**: Consider using a process manager like PM2 to ensure the Python processes are properly managed.

5. **WebSocket Support**: Ensure your deployment platform supports WebSockets for real-time communication.

## Conclusion

This implementation provides a robust bridge between the Next.js frontend and Fast-Agent, enabling multimodal chat capabilities with MCP servers. The modular design allows for easy extension and customization, while the WebSocket integration ensures real-time communication for a responsive user experience.

The next step is to integrate server-side MCP capabilities, which will build upon this foundation to provide more advanced features and workflows.
