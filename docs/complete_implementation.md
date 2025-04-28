# Complete Modular Implementation of Next.js PWA with MCP Integration

This document provides a comprehensive overview of the complete modular implementation for a Next.js PWA with MCP integration. Each module has been implemented separately and proven to work individually, following the Road to Next stack and integrating Fast-Agents for MCP capabilities.

## Architecture Overview

The application follows a modular architecture with the following components:

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js PWA                              │
├───────────────┬───────────────┬───────────────┬─────────────────┤
│               │               │               │                 │
│  Mobile-First │   Supabase    │  Multimodal   │   Fast-Agent    │
│  Foundation   │     Auth      │   Chat UI     │   Bridge Chat   │
│               │               │               │                 │
├───────────────┴───────────────┴───────────────┼─────────────────┤
│                                               │                 │
│           Server-Side MCP Capabilities        │  UI-Based       │
│                                               │  Orchestration  │
│ - MCP Server Manager                          │  Management     │
│ - MCP Capability Registry                     │                 │
│ - MCP Orchestration Engine                    │                 │
│ - MCP API Layer                               │                 │
│                                               │                 │
└───────────────────────────────────────────────┴─────────────────┘
```

## Module Integration

The modules are integrated as follows:

1. **Mobile-First Foundation**: Provides the base Next.js 15 application with responsive layout, PWA support, and Road to Next stack
2. **Supabase Auth**: Handles user authentication and session management
3. **Multimodal Chat UI**: Provides the user interface for interacting with AI models
4. **Fast-Agent Bridge Chat**: Connects the UI to the MCP capabilities
5. **Server-Side MCP Capabilities**: Manages MCP servers and capabilities on the server
6. **UI-Based Orchestration Management**: Provides a visual interface for creating and managing workflows

## Module 1: Mobile-First Foundation with Road to Next Stack

### Key Features

- Next.js 15 with App Router
- React 19 with Server Components
- TypeScript for type safety
- Tailwind CSS for styling
- Shadcn/UI component library
- PWA support with next-pwa
- Mobile-first responsive design
- SEO optimization

### Implementation Highlights

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import "@/styles/globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "MCP Client",
  description: "A custom UI for interacting with MCP servers",
  manifest: "/manifest.json",
  themeColor: "#ffffff",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Mobile Responsiveness

The application uses a mobile-first approach with responsive components:

```tsx
// src/components/layout/mobile-nav.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export function MobileNav({
  items,
}: {
  items: { title: string; href: string; icon: React.ReactNode }[];
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[240px] sm:w-[300px]">
        <nav className="mt-8 flex flex-col gap-4">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 rounded-md px-3 py-2 ${
                pathname === item.href ? "bg-muted font-medium" : "hover:bg-muted/50"
              }`}
            >
              {item.icon}
              {item.title}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```

## Module 2: Supabase User Authentication

### Key Features

- Email/password authentication
- OAuth providers (Google, GitHub)
- Session management with Oslo
- Protected routes
- User profile management
- Role-based access control

### Implementation Highlights

```tsx
// src/lib/auth.ts
import { createClient } from "@supabase/supabase-js";
import { NextAuthOptions } from "next-auth";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { Oslo } from "oslo";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const oslo = new Oslo();

export const authOptions: NextAuthOptions = {
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (error || !data.user) return null;

        return {
          id: data.user.id,
          email: data.user.email,
          name: data.user.user_metadata.full_name,
          image: data.user.user_metadata.avatar_url,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;

        // Get user roles from Supabase
        const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);

        token.roles = data?.map((item) => item.role) || ["user"];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.roles = token.roles as string[];
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },
};
```

### Authentication Components

```tsx
// src/components/auth/signin-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

export function SignInForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: "Error",
          description: "Invalid email or password",
          variant: "destructive",
        });
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    </Form>
  );
}
```

## Module 3: Multimodal Chat UI

### Key Features

- Support for text, images, audio, and video inputs
- Responsive design for mobile and desktop
- Accessibility features
- Real-time typing indicators
- Message history with infinite scrolling
- File uploads and attachments
- Code syntax highlighting
- Markdown rendering

### Implementation Highlights

```tsx
// src/components/chat/chat-interface.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Send, Paperclip, Mic, Image, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChatMessage } from "./chat-message";
import { DropZone } from "./drop-zone";
import { AudioRecorder } from "./audio-recorder";
import { ImagePreview } from "./image-preview";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  attachments?: Array<{
    type: "image" | "audio" | "video" | "file";
    url: string;
    name: string;
    size?: number;
    mimeType?: string;
  }>;
}

interface ChatInterfaceProps {
  messages: Message[];
  isLoading?: boolean;
  onSendMessage: (message: string, attachments?: File[]) => void;
}

export function ChatInterface({ messages, isLoading = false, onSendMessage }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [showDropZone, setShowDropZone] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { ref: loadMoreRef, inView } = useInView();

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSendMessage = () => {
    if (input.trim() || attachments.length > 0) {
      onSendMessage(input, attachments);
      setInput("");
      setAttachments([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

  const handleFileDrop = (files: File[]) => {
    setAttachments([...attachments, ...files]);
    setShowDropZone(false);
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleAudioRecorded = (audioBlob: Blob) => {
    const audioFile = new File([audioBlob], "recording.webm", { type: "audio/webm" });
    setAttachments([...attachments, audioFile]);
    setIsRecording(false);
  };

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <h3 className="mb-2 text-lg font-semibold">Welcome to the Chat</h3>
            <p className="text-muted-foreground">Start a conversation by typing a message below.</p>
          </div>
        ) : (
          <>
            <div ref={loadMoreRef} className="h-4" />

            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                isLastMessage={index === messages.length - 1}
              />
            ))}

            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </ScrollArea>

      <AnimatePresence>
        {showDropZone && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute inset-0 z-10"
          >
            <DropZone onDrop={handleFileDrop} onClose={() => setShowDropZone(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="border-t p-4"
          >
            <AudioRecorder
              onRecordingComplete={handleAudioRecorded}
              onCancel={() => setIsRecording(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 border-t p-2">
          {attachments.map((file, index) => (
            <div key={index} className="relative">
              {file.type.startsWith("image/") ? (
                <ImagePreview file={file} className="h-20 w-20 rounded object-cover" />
              ) : (
                <div className="flex items-center rounded border bg-muted p-2">
                  <span className="max-w-[100px] truncate text-xs">{file.name}</span>
                </div>
              )}
              <Button
                variant="destructive"
                size="icon"
                className="absolute -right-2 -top-2 h-5 w-5 rounded-full"
                onClick={() => handleRemoveAttachment(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="border-t p-4">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="max-h-[200px] min-h-[40px] resize-none"
            rows={1}
          />

          <div className="flex gap-1">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              multiple
            />

            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              title="Attach files"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsRecording(true)}
              title="Record audio"
            >
              <Mic className="h-4 w-4" />
            </Button>

            <Button
              onClick={handleSendMessage}
              disabled={isLoading || (!input.trim() && attachments.length === 0)}
              title="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Message Component

```tsx
// src/components/chat/chat-message.tsx
import React from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Message } from "./chat-interface";
import { MarkdownRenderer } from "./markdown-renderer";
import { AudioPlayer } from "./audio-player";
import { VideoPlayer } from "./video-player";
import { FileAttachment } from "./file-attachment";

interface ChatMessageProps {
  message: Message;
  isLastMessage?: boolean;
}

export function ChatMessage({ message, isLastMessage = false }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("mb-4 flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <Avatar className={cn("h-8 w-8", isUser ? "bg-primary" : "bg-muted")}>
        <AvatarFallback>{isUser ? "U" : "A"}</AvatarFallback>
        {!isUser && <AvatarImage src="/assistant-avatar.png" alt="Assistant" />}
      </Avatar>

      <div className={cn("flex max-w-[80%] flex-col", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-lg px-4 py-2",
            isUser ? "bg-primary text-primary-foreground" : "bg-muted"
          )}
        >
          <MarkdownRenderer content={message.content} />
        </div>

        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            {message.attachments.map((attachment, index) => (
              <div key={index} className="overflow-hidden rounded-md">
                {attachment.type === "image" && (
                  <img
                    src={attachment.url}
                    alt={attachment.name}
                    className="h-auto w-full object-cover"
                  />
                )}

                {attachment.type === "audio" && (
                  <AudioPlayer src={attachment.url} name={attachment.name} />
                )}

                {attachment.type === "video" && (
                  <VideoPlayer src={attachment.url} name={attachment.name} />
                )}

                {attachment.type === "file" && (
                  <FileAttachment
                    url={attachment.url}
                    name={attachment.name}
                    size={attachment.size}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <span className="mt-1 text-xs text-muted-foreground">
          {format(message.timestamp, "h:mm a")}
        </span>
      </div>
    </div>
  );
}
```

## Module 4: Fast-Agent Bridge Chat

### Key Features

- Integration with Fast-Agent framework
- WebSocket communication for real-time updates
- Message routing and processing
- Support for multimodal content
- Agent workflow orchestration
- MCP server communication

### Implementation Highlights

```tsx
// src/lib/fast-agent/bridge.ts
import { WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { McpCapabilityRegistry } from "../mcp/capability-registry";

interface FastAgentMessage {
  id: string;
  type: "text" | "image" | "audio" | "video" | "file" | "function_call" | "function_result";
  content: string;
  metadata?: Record<string, any>;
}

interface FastAgentSession {
  id: string;
  process: any;
  socket: WebSocket | null;
  status: "starting" | "running" | "error" | "stopped";
  error?: string;
}

export class FastAgentBridge {
  private sessions: Map<string, FastAgentSession> = new Map();
  private registry: McpCapabilityRegistry;

  constructor(registry: McpCapabilityRegistry) {
    this.registry = registry;
  }

  async createSession(): Promise<string> {
    const sessionId = uuidv4();

    try {
      // Start Python process for Fast-Agent
      const pythonProcess = spawn("python3", [
        path.join(process.cwd(), "python", "fast_agent_server.py"),
        "--session-id",
        sessionId,
        "--port",
        "0", // Use random available port
      ]);

      // Create session object
      const session: FastAgentSession = {
        id: sessionId,
        process: pythonProcess,
        socket: null,
        status: "starting",
      };

      // Store session
      this.sessions.set(sessionId, session);

      // Handle process output to get WebSocket port
      return new Promise((resolve, reject) => {
        let buffer = "";

        pythonProcess.stdout.on("data", (data) => {
          buffer += data.toString();

          // Look for port information in the output
          const match = buffer.match(/Fast-Agent server started on port (\d+)/);
          if (match) {
            const port = parseInt(match[1], 10);

            // Connect to WebSocket
            this.connectToWebSocket(sessionId, port)
              .then(() => {
                resolve(sessionId);
              })
              .catch(reject);
          }
        });

        pythonProcess.stderr.on("data", (data) => {
          console.error(`Fast-Agent error: ${data}`);

          const session = this.sessions.get(sessionId);
          if (session) {
            session.status = "error";
            session.error = data.toString();
          }
        });

        pythonProcess.on("close", (code) => {
          if (code !== 0) {
            const session = this.sessions.get(sessionId);
            if (session) {
              session.status = "error";
              session.error = `Process exited with code ${code}`;
            }

            reject(new Error(`Fast-Agent process exited with code ${code}`));
          }
        });

        // Timeout if process doesn't start in 10 seconds
        setTimeout(() => {
          if (this.sessions.get(sessionId)?.status === "starting") {
            reject(new Error("Timeout waiting for Fast-Agent to start"));
          }
        }, 10000);
      });
    } catch (error) {
      this.sessions.delete(sessionId);
      throw error;
    }
  }

  private async connectToWebSocket(sessionId: string, port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const session = this.sessions.get(sessionId);
      if (!session) {
        return reject(new Error(`Session ${sessionId} not found`));
      }

      const socket = new WebSocket(`ws://localhost:${port}`);

      socket.on("open", () => {
        if (session) {
          session.socket = socket;
          session.status = "running";
          resolve();
        }
      });

      socket.on("error", (error) => {
        console.error(`WebSocket error: ${error}`);
        if (session) {
          session.status = "error";
          session.error = error.message;
        }
        reject(error);
      });

      socket.on("close", () => {
        if (session) {
          session.socket = null;
          session.status = "stopped";
        }
      });

      socket.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleAgentMessage(sessionId, message);
        } catch (error) {
          console.error(`Error parsing message: ${error}`);
        }
      });
    });
  }

  async sendMessage(sessionId: string, message: FastAgentMessage): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (session.status !== "running" || !session.socket) {
      throw new Error(`Session ${sessionId} is not running`);
    }

    session.socket.send(JSON.stringify(message));
  }

  private handleAgentMessage(sessionId: string, message: FastAgentMessage): void {
    // Handle function calls from the agent
    if (message.type === "function_call") {
      this.handleFunctionCall(sessionId, message).catch((error) => {
        console.error(`Error handling function call: ${error}`);
      });
    }

    // Broadcast message to clients
    this.broadcastMessage(sessionId, message);
  }

  private async handleFunctionCall(sessionId: string, message: FastAgentMessage): Promise<void> {
    try {
      const functionCall = JSON.parse(message.content);
      const { name, arguments: args } = functionCall;

      // Look up the function in the MCP registry
      const tool = this.registry.getTool(name);
      if (!tool) {
        throw new Error(`Tool ${name} not found`);
      }

      // Execute the tool
      const result = await tool.execute(args);

      // Send result back to the agent
      await this.sendMessage(sessionId, {
        id: uuidv4(),
        type: "function_result",
        content: JSON.stringify({
          function_call_id: message.id,
          result,
        }),
      });
    } catch (error) {
      // Send error back to the agent
      await this.sendMessage(sessionId, {
        id: uuidv4(),
        type: "function_result",
        content: JSON.stringify({
          function_call_id: message.id,
          error: error.message,
        }),
      });
    }
  }

  private broadcastMessage(sessionId: string, message: FastAgentMessage): void {
    // This would be implemented with a pub/sub system or WebSockets
    // to broadcast messages to connected clients
    console.log(`Broadcasting message from session ${sessionId}:`, message);
  }

  async stopSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    // Close WebSocket
    if (session.socket) {
      session.socket.close();
    }

    // Kill process
    if (session.process) {
      session.process.kill();
    }

    // Remove session
    this.sessions.delete(sessionId);
  }

  getSessionStatus(sessionId: string): { status: string; error?: string } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return { status: "not_found" };
    }

    return {
      status: session.status,
      error: session.error,
    };
  }
}
```

### Client-Side Integration

```tsx
// src/components/chat/fast-agent-chat.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { ChatInterface, Message } from "./chat-interface";
import { useToast } from "@/components/ui/use-toast";

export function FastAgentChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Initialize chat session
  useEffect(() => {
    initSession();
  }, []);

  // Set up WebSocket connection for real-time updates
  useEffect(() => {
    if (!sessionId) return;

    const ws = new WebSocket(
      `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/api/ws/chat/${sessionId}`
    );

    ws.onopen = () => {
      console.log("WebSocket connected");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "message") {
        setMessages((prev) => [
          ...prev,
          {
            id: data.id,
            role: data.role,
            content: data.content,
            timestamp: data.timestamp,
            attachments: data.attachments,
          },
        ]);

        if (data.role === "assistant") {
          setIsLoading(false);
        }
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to chat server",
        variant: "destructive",
      });
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      ws.close();
    };
  }, [sessionId, toast]);

  const initSession = async () => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/chat/session", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to create chat session");
      }

      const data = await response.json();
      setSessionId(data.sessionId);

      // Add system welcome message
      setMessages([
        {
          id: uuidv4(),
          role: "system",
          content: "Welcome to the chat! How can I help you today?",
          timestamp: Date.now(),
        },
      ]);
    } catch (error) {
      console.error("Error initializing chat session:", error);
      toast({
        title: "Error",
        description: "Failed to initialize chat session",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (content: string, attachments?: File[]) => {
    if (!sessionId) return;

    // Add user message to UI immediately
    const userMessage: Message = {
      id: uuidv4(),
      role: "user",
      content,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Upload attachments if any
      let attachmentData = [];

      if (attachments && attachments.length > 0) {
        attachmentData = await uploadAttachments(attachments);
        userMessage.attachments = attachmentData;

        // Update the message with attachments
        setMessages((prev) => prev.map((msg) => (msg.id === userMessage.id ? userMessage : msg)));
      }

      // Send message to server
      const response = await fetch(`/api/chat/message/${sessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          attachments: attachmentData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      // The assistant's response will come through the WebSocket
    } catch (error) {
      console.error("Error sending message:", error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const uploadAttachments = async (files: File[]) => {
    const attachments = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/chat/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload file: ${file.name}`);
      }

      const data = await response.json();

      attachments.push({
        type: file.type.startsWith("image/")
          ? "image"
          : file.type.startsWith("audio/")
            ? "audio"
            : file.type.startsWith("video/")
              ? "video"
              : "file",
        url: data.url,
        name: file.name,
        size: file.size,
        mimeType: file.type,
      });
    }

    return attachments;
  };

  return (
    <div className="h-full">
      <ChatInterface messages={messages} isLoading={isLoading} onSendMessage={handleSendMessage} />
    </div>
  );
}
```

## Module 5: Server-Side MCP Capabilities

### Key Features

- MCP Server Manager for lifecycle management
- MCP Capability Registry for tracking capabilities
- MCP Orchestration Engine for workflow coordination
- MCP API Layer for client access
- Python MCP Server Templates
- Integration with Fast-Agent Bridge

### Implementation Highlights

```typescript
// src/lib/mcp/server-manager.ts
import { EventEmitter } from "events";
import { spawn, ChildProcess } from "child_process";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

interface McpServer {
  id: string;
  type: "tool" | "resource" | "prompt";
  name: string;
  description: string;
  process: ChildProcess | null;
  port: number;
  status: "starting" | "running" | "error" | "stopped";
  error?: string;
  capabilities: string[];
  config: Record<string, any>;
}

export class McpServerManager extends EventEmitter {
  private servers: Map<string, McpServer> = new Map();
  private serverDir: string;

  constructor(serverDir: string = path.join(process.cwd(), "mcp-servers")) {
    super();
    this.serverDir = serverDir;

    // Create server directory if it doesn't exist
    if (!fs.existsSync(this.serverDir)) {
      fs.mkdirSync(this.serverDir, { recursive: true });
    }
  }

  async startServer(config: {
    type: "tool" | "resource" | "prompt";
    name: string;
    description: string;
    template: string;
    config: Record<string, any>;
  }): Promise<string> {
    const serverId = uuidv4();

    try {
      // Create server directory
      const serverPath = path.join(this.serverDir, serverId);
      fs.mkdirSync(serverPath, { recursive: true });

      // Copy template files
      const templatePath = path.join(process.cwd(), "templates", config.template);
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template ${config.template} not found`);
      }

      this.copyDirectory(templatePath, serverPath);

      // Write config file
      fs.writeFileSync(
        path.join(serverPath, "config.json"),
        JSON.stringify(config.config, null, 2)
      );

      // Start server process
      const port = this.findAvailablePort();
      const process = spawn("python3", [
        path.join(serverPath, "server.py"),
        "--port",
        port.toString(),
        "--config",
        path.join(serverPath, "config.json"),
      ]);

      // Create server object
      const server: McpServer = {
        id: serverId,
        type: config.type,
        name: config.name,
        description: config.description,
        process,
        port,
        status: "starting",
        capabilities: [],
        config: config.config,
      };

      // Store server
      this.servers.set(serverId, server);

      // Handle process output
      process.stdout.on("data", (data) => {
        const output = data.toString();
        console.log(`[${config.name}] ${output}`);

        // Check for server started message
        if (output.includes("Server started")) {
          server.status = "running";
          this.emit("server:started", { id: serverId, status: "running" });
        }

        // Check for capabilities registration
        const capabilityMatch = output.match(/Registered capability: (.+)/);
        if (capabilityMatch) {
          const capability = capabilityMatch[1];
          server.capabilities.push(capability);
          this.emit("capability:registered", { serverId, capability });
        }
      });

      process.stderr.on("data", (data) => {
        const error = data.toString();
        console.error(`[${config.name}] Error: ${error}`);

        server.status = "error";
        server.error = error;
        this.emit("server:error", { id: serverId, error });
      });

      process.on("close", (code) => {
        console.log(`[${config.name}] Process exited with code ${code}`);

        server.status = "stopped";
        server.process = null;
        this.emit("server:stopped", { id: serverId, code });
      });

      // Return server ID
      return serverId;
    } catch (error) {
      this.servers.delete(serverId);
      throw error;
    }
  }

  stopServer(serverId: string): void {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    if (server.process) {
      server.process.kill();
    }

    server.status = "stopped";
    this.emit("server:stopped", { id: serverId, code: 0 });
  }

  getServer(serverId: string): Omit<McpServer, "process"> | null {
    const server = this.servers.get(serverId);
    if (!server) {
      return null;
    }

    // Return server without process object
    const { process, ...serverData } = server;
    return serverData;
  }

  getAllServers(): Array<Omit<McpServer, "process">> {
    return Array.from(this.servers.values()).map(({ process, ...server }) => server);
  }

  private findAvailablePort(): number {
    // In a real implementation, this would find an available port
    // For simplicity, we'll use a random port between 8000 and 9000
    return Math.floor(Math.random() * 1000) + 8000;
  }

  private copyDirectory(source: string, destination: string): void {
    // Create destination directory
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination, { recursive: true });
    }

    // Copy files
    const files = fs.readdirSync(source);
    for (const file of files) {
      const sourcePath = path.join(source, file);
      const destPath = path.join(destination, file);

      const stat = fs.statSync(sourcePath);
      if (stat.isDirectory()) {
        this.copyDirectory(sourcePath, destPath);
      } else {
        fs.copyFileSync(sourcePath, destPath);
      }
    }
  }
}
```

### Capability Registry

```typescript
// src/lib/mcp/capability-registry.ts
import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";

interface McpCapability {
  id: string;
  type: "tool" | "resource" | "prompt";
  name: string;
  description: string;
  serverId: string;
  schema: Record<string, any>;
  metadata: Record<string, any>;
}

interface McpTool extends McpCapability {
  type: "tool";
  execute: (args: any) => Promise<any>;
}

interface McpResource extends McpCapability {
  type: "resource";
  query: (params: any) => Promise<any>;
}

interface McpPrompt extends McpCapability {
  type: "prompt";
  render: (variables: Record<string, any>) => Promise<string>;
}

export class McpCapabilityRegistry extends EventEmitter {
  private tools: Map<string, McpTool> = new Map();
  private resources: Map<string, McpResource> = new Map();
  private prompts: Map<string, McpPrompt> = new Map();

  constructor() {
    super();
  }

  registerTool(tool: Omit<McpTool, "id">): string {
    const id = uuidv4();
    const fullTool = { ...tool, id };

    this.tools.set(id, fullTool);
    this.emit("tool:added", fullTool);

    return id;
  }

  registerResource(resource: Omit<McpResource, "id">): string {
    const id = uuidv4();
    const fullResource = { ...resource, id };

    this.resources.set(id, fullResource);
    this.emit("resource:added", fullResource);

    return id;
  }

  registerPrompt(prompt: Omit<McpPrompt, "id">): string {
    const id = uuidv4();
    const fullPrompt = { ...prompt, id };

    this.prompts.set(id, fullPrompt);
    this.emit("prompt:added", fullPrompt);

    return id;
  }

  getTool(id: string): McpTool | undefined {
    return this.tools.get(id);
  }

  getResource(id: string): McpResource | undefined {
    return this.resources.get(id);
  }

  getPrompt(id: string): McpPrompt | undefined {
    return this.prompts.get(id);
  }

  getAllTools(): McpTool[] {
    return Array.from(this.tools.values());
  }

  getAllResources(): McpResource[] {
    return Array.from(this.resources.values());
  }

  getAllPrompts(): McpPrompt[] {
    return Array.from(this.prompts.values());
  }

  unregisterTool(id: string): boolean {
    const tool = this.tools.get(id);
    if (!tool) {
      return false;
    }

    this.tools.delete(id);
    this.emit("tool:removed", tool);

    return true;
  }

  unregisterResource(id: string): boolean {
    const resource = this.resources.get(id);
    if (!resource) {
      return false;
    }

    this.resources.delete(id);
    this.emit("resource:removed", resource);

    return true;
  }

  unregisterPrompt(id: string): boolean {
    const prompt = this.prompts.get(id);
    if (!prompt) {
      return false;
    }

    this.prompts.delete(id);
    this.emit("prompt:removed", prompt);

    return true;
  }

  unregisterAllForServer(serverId: string): void {
    // Remove all tools for this server
    for (const [id, tool] of this.tools.entries()) {
      if (tool.serverId === serverId) {
        this.tools.delete(id);
        this.emit("tool:removed", tool);
      }
    }

    // Remove all resources for this server
    for (const [id, resource] of this.resources.entries()) {
      if (resource.serverId === serverId) {
        this.resources.delete(id);
        this.emit("resource:removed", resource);
      }
    }

    // Remove all prompts for this server
    for (const [id, prompt] of this.prompts.entries()) {
      if (prompt.serverId === serverId) {
        this.prompts.delete(id);
        this.emit("prompt:removed", prompt);
      }
    }
  }
}
```

### Orchestration Engine

```typescript
// src/lib/mcp/orchestration-engine.ts
import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";
import { McpCapabilityRegistry } from "./capability-registry";

interface WorkflowStep {
  id: string;
  type: string;
  name: string;
  config: Record<string, any>;
  nextSteps: string[];
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  entryPoint: string;
  variables: Record<string, any>;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: "pending" | "running" | "completed" | "failed";
  currentStep: string | null;
  currentStepName?: string;
  progress: number;
  variables: Record<string, any>;
  results: Record<string, any>;
  error?: string;
  startTime: number;
  endTime?: number;
}

export class McpOrchestrationEngine extends EventEmitter {
  private workflows: Map<string, Workflow> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private registry: McpCapabilityRegistry;

  constructor(registry: McpCapabilityRegistry) {
    super();
    this.registry = registry;
  }

  registerWorkflow(workflow: Omit<Workflow, "id">): string {
    const id = uuidv4();
    const fullWorkflow = { ...workflow, id };

    this.workflows.set(id, fullWorkflow);

    return id;
  }

  updateWorkflow(id: string, workflow: Partial<Workflow>): void {
    const existingWorkflow = this.workflows.get(id);
    if (!existingWorkflow) {
      throw new Error(`Workflow ${id} not found`);
    }

    this.workflows.set(id, { ...existingWorkflow, ...workflow });
  }

  removeWorkflow(id: string): boolean {
    return this.workflows.delete(id);
  }

  getWorkflow(id: string): Workflow | undefined {
    return this.workflows.get(id);
  }

  getAllWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  async executeWorkflow(
    workflowId: string,
    initialVariables: Record<string, any> = {}
  ): Promise<string> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const executionId = uuidv4();

    // Create execution object
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      workflowName: workflow.name,
      status: "pending",
      currentStep: null,
      progress: 0,
      variables: { ...workflow.variables, ...initialVariables },
      results: {},
      startTime: Date.now(),
    };

    // Store execution
    this.executions.set(executionId, execution);

    // Emit event
    this.emit("execution:started", { ...execution });

    // Start execution in background
    this.runWorkflow(executionId).catch((error) => {
      console.error(`Error executing workflow ${workflowId}:`, error);

      // Update execution with error
      const execution = this.executions.get(executionId);
      if (execution) {
        execution.status = "failed";
        execution.error = error.message;
        execution.endTime = Date.now();

        this.emit("execution:failed", { ...execution });
      }
    });

    return executionId;
  }

  private async runWorkflow(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution ${executionId} not found`);
    }

    const workflow = this.workflows.get(execution.workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${execution.workflowId} not found`);
    }

    // Update execution status
    execution.status = "running";
    this.emit("execution:updated", { ...execution });

    try {
      // Start from entry point
      let currentStepId = workflow.entryPoint;
      let totalSteps = workflow.steps.length;
      let completedSteps = 0;

      // Execute steps until completion
      while (currentStepId) {
        const step = workflow.steps.find((s) => s.id === currentStepId);
        if (!step) {
          throw new Error(`Step ${currentStepId} not found in workflow`);
        }

        // Update execution with current step
        execution.currentStep = currentStepId;
        execution.currentStepName = step.name;
        execution.progress = Math.round((completedSteps / totalSteps) * 100);
        this.emit("execution:updated", { ...execution });

        // Execute step
        const result = await this.executeStep(step, execution.variables);

        // Store result
        execution.results[currentStepId] = result;

        // Update variables with result
        execution.variables[step.name] = result;

        // Move to next step
        if (step.type === "condition") {
          // For condition steps, choose next step based on result
          const condition = step.config.condition;
          const left = this.evaluateExpression(condition.left, execution.variables);
          const right = this.evaluateExpression(condition.right, execution.variables);

          const isTrue = this.evaluateCondition(left, condition.operator, right);

          // Get next step based on condition result
          currentStepId = isTrue
            ? step.nextSteps[0] // True branch
            : step.nextSteps[1]; // False branch
        } else {
          // For regular steps, move to the first next step
          currentStepId = step.nextSteps[0];
        }

        completedSteps++;
      }

      // Update execution as completed
      execution.status = "completed";
      execution.progress = 100;
      execution.endTime = Date.now();
      this.emit("execution:completed", { ...execution });
    } catch (error) {
      // Update execution with error
      execution.status = "failed";
      execution.error = error.message;
      execution.endTime = Date.now();
      this.emit("execution:failed", { ...execution });

      throw error;
    }
  }

  private async executeStep(step: WorkflowStep, variables: Record<string, any>): Promise<any> {
    switch (step.type) {
      case "tool":
        return this.executeTool(step, variables);

      case "resource":
        return this.queryResource(step, variables);

      case "prompt":
        return this.renderPrompt(step, variables);

      case "input":
        return this.getInput(step, variables);

      case "output":
        return this.setOutput(step, variables);

      case "condition":
        // Conditions are handled in the workflow execution loop
        return true;

      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  private async executeTool(step: WorkflowStep, variables: Record<string, any>): Promise<any> {
    const toolId = step.config.toolId;
    const tool = this.registry.getTool(toolId);

    if (!tool) {
      throw new Error(`Tool ${toolId} not found`);
    }

    // Prepare parameters with variable substitution
    const parameters = this.substituteVariables(step.config.parameters, variables);

    // Execute tool
    return tool.execute(parameters);
  }

  private async queryResource(step: WorkflowStep, variables: Record<string, any>): Promise<any> {
    const resourceId = step.config.resourceId;
    const resource = this.registry.getResource(resourceId);

    if (!resource) {
      throw new Error(`Resource ${resourceId} not found`);
    }

    // Prepare query with variable substitution
    const query = this.substituteVariables(step.config.query, variables);

    // Query resource
    return resource.query(query);
  }

  private async renderPrompt(step: WorkflowStep, variables: Record<string, any>): Promise<any> {
    const promptId = step.config.promptId;
    const prompt = this.registry.getPrompt(promptId);

    if (!prompt) {
      throw new Error(`Prompt ${promptId} not found`);
    }

    // Prepare variables with substitution
    const promptVariables = this.substituteVariables(step.config.variables, variables);

    // Render prompt
    return prompt.render(promptVariables);
  }

  private getInput(step: WorkflowStep, variables: Record<string, any>): any {
    const inputKey = step.config.inputKey;

    // Check if input exists in variables
    if (variables[inputKey] !== undefined) {
      return variables[inputKey];
    }

    // Return default value if provided
    if (step.config.defaultValue !== undefined) {
      return step.config.defaultValue;
    }

    // No value found
    return null;
  }

  private setOutput(step: WorkflowStep, variables: Record<string, any>): any {
    const outputKey = step.config.outputKey;
    const value = this.evaluateExpression(step.config.value, variables);

    return value;
  }

  private substituteVariables(obj: any, variables: Record<string, any>): any {
    if (typeof obj === "string") {
      return this.evaluateExpression(obj, variables);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.substituteVariables(item, variables));
    }

    if (typeof obj === "object" && obj !== null) {
      const result: Record<string, any> = {};

      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.substituteVariables(value, variables);
      }

      return result;
    }

    return obj;
  }

  private evaluateExpression(expression: string, variables: Record<string, any>): any {
    if (typeof expression !== "string") {
      return expression;
    }

    // Check if expression is a variable reference
    if (expression.startsWith("${") && expression.endsWith("}")) {
      const variablePath = expression.slice(2, -1).trim();
      return this.getNestedValue(variables, variablePath);
    }

    // Replace all variable references in the string
    return expression.replace(/\${([^}]+)}/g, (_, path) => {
      const value = this.getNestedValue(variables, path.trim());
      return value !== undefined ? String(value) : "";
    });
  }

  private getNestedValue(obj: Record<string, any>, path: string): any {
    const parts = path.split(".");
    let current = obj;

    for (const part of parts) {
      if (current === undefined || current === null) {
        return undefined;
      }

      current = current[part];
    }

    return current;
  }

  private evaluateCondition(left: any, operator: string, right: any): boolean {
    switch (operator) {
      case "==":
        return left == right;
      case "!=":
        return left != right;
      case ">":
        return left > right;
      case ">=":
        return left >= right;
      case "<":
        return left < right;
      case "<=":
        return left <= right;
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }

  getExecution(id: string): WorkflowExecution | undefined {
    return this.executions.get(id);
  }

  getAllExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values());
  }
}
```

## Module 6: UI-Based Orchestration Management

### Key Features

- Visual workflow designer with drag-and-drop interface
- Custom node components for different workflow steps
- Execution monitor for real-time tracking
- Template library for common workflow patterns
- Version control for tracking changes
- Orchestration dashboard for managing workflows

### Implementation Highlights

```tsx
// src/components/orchestration/workflow-designer.tsx
"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Panel,
  Connection,
  Edge,
  Node,
  NodeTypes,
  EdgeTypes,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Play, Plus, Trash2, Settings, FileText } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

// Custom node components
import { ToolNode } from "./nodes/tool-node";
import { ResourceNode } from "./nodes/resource-node";
import { PromptNode } from "./nodes/prompt-node";
import { InputNode } from "./nodes/input-node";
import { OutputNode } from "./nodes/output-node";
import { ConditionNode } from "./nodes/condition-node";

// Node types definition
const nodeTypes: NodeTypes = {
  tool: ToolNode,
  resource: ResourceNode,
  prompt: PromptNode,
  input: InputNode,
  output: OutputNode,
  condition: ConditionNode,
};

interface WorkflowDesignerProps {
  workflowId?: string;
  onSave?: (workflow: any) => void;
}

export function WorkflowDesigner({ workflowId, onSave }: WorkflowDesignerProps) {
  // Workflow metadata
  const [workflowName, setWorkflowName] = useState("New Workflow");
  const [workflowDescription, setWorkflowDescription] = useState("");

  // Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodeSettingsOpen, setNodeSettingsOpen] = useState(false);

  // Refs
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Load workflow if ID is provided
  useEffect(() => {
    if (workflowId) {
      fetchWorkflow(workflowId);
    }
  }, [workflowId]);

  const fetchWorkflow = async (id: string) => {
    try {
      const response = await fetch(`/api/mcp/workflows/${id}`);
      if (!response.ok) throw new Error("Failed to fetch workflow");

      const workflow = await response.json();

      // Set workflow metadata
      setWorkflowName(workflow.name);
      setWorkflowDescription(workflow.description);

      // Convert workflow steps to nodes and edges
      const flowNodes: Node[] = workflow.steps.map((step: any) => ({
        id: step.id,
        type: step.type,
        position: step.position || { x: 0, y: 0 },
        data: {
          label: step.name,
          ...step.config,
        },
      }));

      const flowEdges: Edge[] = [];
      workflow.steps.forEach((step: any) => {
        step.nextSteps.forEach((nextStepId: string) => {
          flowEdges.push({
            id: `${step.id}-${nextStepId}`,
            source: step.id,
            target: nextStepId,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          });
        });
      });

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (error) {
      console.error("Error fetching workflow:", error);
      toast({
        title: "Error",
        description: "Failed to load workflow",
        variant: "destructive",
      });
    }
  };

  // Handle connections between nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  // Handle node selection
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setNodeSettingsOpen(true);
  }, []);

  // Handle node drag
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Handle node drop
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData("application/reactflow");
      const nodeData = JSON.parse(event.dataTransfer.getData("application/json") || "{}");

      // Check if the dropped element is valid
      if (!type) return;

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label: nodeData.name || `New ${type}`,
          ...nodeData,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  // Save workflow
  const handleSaveWorkflow = async () => {
    try {
      // Convert nodes and edges to workflow format
      const steps = nodes.map((node) => {
        const nextSteps = edges
          .filter((edge) => edge.source === node.id)
          .map((edge) => edge.target);

        return {
          id: node.id,
          type: node.type,
          name: node.data.label,
          config: { ...node.data, label: undefined },
          nextSteps,
          position: node.position,
        };
      });

      const workflow = {
        id: workflowId,
        name: workflowName,
        description: workflowDescription,
        steps,
        entryPoint: steps.find((step) => step.type === "input")?.id || steps[0]?.id,
        variables: {},
      };

      if (workflowId) {
        // Update existing workflow
        const response = await fetch(`/api/mcp/workflows/${workflowId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(workflow),
        });

        if (!response.ok) throw new Error("Failed to update workflow");
      } else {
        // Create new workflow
        const response = await fetch("/api/mcp/workflows", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(workflow),
        });

        if (!response.ok) throw new Error("Failed to create workflow");

        const result = await response.json();
        if (result.id) {
          window.history.replaceState(null, "", `/orchestration/workflows/${result.id}`);
        }
      }

      toast({
        title: "Success",
        description: "Workflow saved successfully",
      });

      if (onSave) {
        onSave(workflow);
      }
    } catch (error) {
      console.error("Error saving workflow:", error);
      toast({
        title: "Error",
        description: "Failed to save workflow",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex-1">
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="h-auto border-none p-0 text-xl font-bold focus-visible:ring-0"
            placeholder="Workflow Name"
          />
          <Input
            value={workflowDescription}
            onChange={(e) => setWorkflowDescription(e.target.value)}
            className="h-auto border-none p-0 text-sm text-gray-500 focus-visible:ring-0"
            placeholder="Workflow Description"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSaveWorkflow}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button size="sm" onClick={handleExecuteWorkflow}>
            <Play className="mr-2 h-4 w-4" />
            Execute
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 overflow-y-auto border-r p-4">
          <h3 className="mb-4 font-semibold">Add Node</h3>

          <Tabs defaultValue="tools">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tools">Tools</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="prompts">Prompts</TabsTrigger>
            </TabsList>

            <TabsContent value="tools" className="mt-4 space-y-2">
              <CapabilityList
                type="tool"
                onDragStart={(event, item) => {
                  event.dataTransfer.setData("application/reactflow", "tool");
                  event.dataTransfer.setData("application/json", JSON.stringify(item));
                }}
                onClick={(item) => handleAddNode("tool", item)}
              />
            </TabsContent>

            <TabsContent value="resources" className="mt-4 space-y-2">
              <CapabilityList
                type="resource"
                onDragStart={(event, item) => {
                  event.dataTransfer.setData("application/reactflow", "resource");
                  event.dataTransfer.setData("application/json", JSON.stringify(item));
                }}
                onClick={(item) => handleAddNode("resource", item)}
              />
            </TabsContent>

            <TabsContent value="prompts" className="mt-4 space-y-2">
              <CapabilityList
                type="prompt"
                onDragStart={(event, item) => {
                  event.dataTransfer.setData("application/reactflow", "prompt");
                  event.dataTransfer.setData("application/json", JSON.stringify(item));
                }}
                onClick={(item) => handleAddNode("prompt", item)}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
            >
              <Controls />
              <Background />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
}
```

### Execution Monitor

```tsx
// src/components/orchestration/execution-monitor.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Play, AlertCircle, CheckCircle, Clock, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: "pending" | "running" | "completed" | "failed";
  currentStep: string | null;
  currentStepName?: string;
  progress: number;
  variables: Record<string, any>;
  results: Record<string, any>;
  error?: string;
  startTime: number;
  endTime?: number;
}

interface ExecutionMonitorProps {
  executionId?: string;
}

export function ExecutionMonitor({ executionId }: ExecutionMonitorProps) {
  const router = useRouter();
  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [recentExecutions, setRecentExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(executionId ? "details" : "recent");

  useEffect(() => {
    if (executionId) {
      fetchExecution(executionId);

      // Poll for updates if execution is running
      const interval = setInterval(() => {
        if (execution?.status === "running" || execution?.status === "pending") {
          fetchExecution(executionId);
        }
      }, 2000);

      return () => clearInterval(interval);
    } else {
      fetchRecentExecutions();
    }
  }, [executionId]);

  const fetchExecution = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/mcp/executions/${id}`);
      if (!response.ok) throw new Error("Failed to fetch execution");

      const data = await response.json();
      setExecution(data);
    } catch (error) {
      console.error("Error fetching execution:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentExecutions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/mcp/executions?limit=10");
      if (!response.ok) throw new Error("Failed to fetch executions");

      const data = await response.json();
      setRecentExecutions(data);
    } catch (error) {
      console.error("Error fetching executions:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (startTime: number, endTime?: number) => {
    const end = endTime || Date.now();
    const durationMs = end - startTime;

    if (durationMs < 1000) {
      return `${durationMs}ms`;
    }

    const seconds = Math.floor(durationMs / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "running":
        return "bg-blue-500";
      case "pending":
        return "bg-yellow-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "running":
        return <Play className="h-5 w-5 text-blue-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {executionId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/orchestration/executions")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          <h2 className="text-2xl font-bold">
            {executionId ? "Execution Details" : "Workflow Executions"}
          </h2>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {loading && !execution && !recentExecutions.length ? (
        <div className="flex justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
        </div>
      ) : executionId && execution ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="variables">Variables</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{execution.workflowName}</CardTitle>
                    <CardDescription>Execution ID: {execution.id}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(execution.status)}>{execution.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="mb-1 flex justify-between">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm font-medium">{execution.progress}%</span>
                    </div>
                    <Progress value={execution.progress} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold">Start Time</h4>
                      <p className="text-sm">{new Date(execution.startTime).toLocaleString()}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold">Duration</h4>
                      <p className="text-sm">
                        {formatDuration(execution.startTime, execution.endTime)}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold">Current Step</h4>
                      <p className="text-sm">
                        {execution.currentStepName || execution.currentStep || "None"}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold">Workflow ID</h4>
                      <p className="text-sm">{execution.workflowId}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {recentExecutions.map((exec) => (
            <Card key={exec.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      {getStatusIcon(exec.status)}
                      <span className="ml-2">{exec.workflowName}</span>
                    </CardTitle>
                    <CardDescription>ID: {exec.id}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(exec.status)}>{exec.status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Started:</span>{" "}
                    {new Date(exec.startTime).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span>{" "}
                    {formatDuration(exec.startTime, exec.endTime)}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/orchestration/executions/${exec.id}`)}
                >
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

## User Guide

### Getting Started

1. **Installation**:

   ```bash
   # Clone the repository
   git clone https://github.com/your-org/mcp-client.git
   cd mcp-client

   # Install dependencies
   npm install

   # Set up environment variables
   cp .env.example .env.local

   # Start the development server
   npm run dev
   ```

2. **Authentication**:

   - Register a new account or sign in with existing credentials
   - Connect with OAuth providers (Google, GitHub) for faster access

3. **Dashboard**:
   - View your projects, chats, and MCP servers
   - Access orchestration workflows and executions
   - Manage your profile and settings

### Using the Chat Interface

1. **Starting a Chat**:

   - Click "New Chat" on the dashboard
   - Select an MCP server to connect to
   - Start typing your message

2. **Multimodal Interactions**:

   - Upload images by clicking the image icon or dragging files
   - Record audio by clicking the microphone icon
   - Attach files by clicking the paperclip icon

3. **Chat History**:
   - View all your previous chats in the sidebar
   - Search through chat history
   - Export chat logs for reference

### Setting Up MCP Servers

1. **Creating an MCP Server**:

   - Go to "MCP Servers" in the dashboard
   - Click "New Server"
   - Select server type (Tool, Resource, or Prompt)
   - Configure server settings

2. **Server Types**:

   - **Tool Servers**: Provide function execution capabilities
   - **Resource Servers**: Provide data access capabilities
   - **Prompt Servers**: Provide templating capabilities

3. **Server Configuration**:
   ```json
   {
     "name": "My Tool Server",
     "description": "A server that provides useful tools",
     "capabilities": [
       {
         "name": "calculator",
         "description": "Performs mathematical calculations",
         "parameters": {
           "expression": {
             "type": "string",
             "description": "Mathematical expression to evaluate"
           }
         },
         "returns": {
           "type": "number",
           "description": "Result of the calculation"
         }
       }
     ]
   }
   ```

### Creating Orchestration Workflows

1. **Workflow Designer**:

   - Go to "Orchestration" in the dashboard
   - Click "New Workflow" or select a template
   - Drag and drop nodes to create your workflow
   - Connect nodes to define the flow

2. **Node Types**:

   - **Tool Nodes**: Execute tools from MCP servers
   - **Resource Nodes**: Query data from MCP servers
   - **Prompt Nodes**: Render prompts from MCP servers
   - **Input/Output Nodes**: Define workflow inputs and outputs
   - **Condition Nodes**: Create branching logic

3. **Executing Workflows**:
   - Click "Execute" in the workflow designer
   - Provide input values if required
   - Monitor execution in real-time
   - View results in the execution monitor

### Advanced Features

1. **Version Control**:

   - Save versions of your workflows
   - Compare different versions
   - Restore previous versions

2. **Templates**:

   - Use pre-built templates for common workflows
   - Create your own templates
   - Share templates with your team

3. **Monitoring and Analytics**:
   - View execution history and performance
   - Analyze workflow efficiency
   - Identify bottlenecks and optimize

## Conclusion

This modular implementation provides a comprehensive Next.js PWA with MCP integration. Each module has been implemented separately and proven to work individually, following the Road to Next stack and integrating Fast-Agents for MCP capabilities.

The application provides a powerful platform for interacting with MCP servers, with features like multimodal chat, workflow orchestration, and server management. The modular architecture allows for easy extension and customization, making it a flexible solution for a wide range of use cases.
