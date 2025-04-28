# Multimodal Chat UI Design with UX Research

## Overview

This document outlines the design of a multimodal chat interface for the Next.js PWA, focusing on creating an intuitive, accessible, and feature-rich experience that supports multiple modes of interaction including text, images, voice, and other media types. The design is informed by UX research, multimodal design best practices, and an analysis of leading multimodal AI models.

## Design Principles

Based on our research into multimodal design best practices, we've identified the following key principles to guide our chat UI design:

1. **Combine Conversation and UX Design**: Make voice commands and other interaction modes feel like natural extensions of the interface, not awkward add-ons.

2. **Focus on Accessibility**: Design the interface to be accessible to users with different abilities, ensuring multiple interaction modes serve to enhance accessibility.

3. **Prioritize User Experience**: Start with understanding user needs and expectations before adding different modalities.

4. **Implement Context-Aware Design**: Ensure the interface adapts dynamically to different contexts and device capabilities.

5. **Provide Clear Communication**: Reduce ambiguity and cognitive load by ensuring messages across different modalities complement each other.

6. **Offer Clear Guidance**: Help users understand what to expect and how to interact with the system.

## Multimodal AI Model Capabilities

Our research into multimodal AI models has revealed the following capabilities that can be leveraged in our chat interface:

1. **OpenAI GPT-4V/GPT-4o**:

   - Text, image, and voice processing capabilities
   - Real-time responses (as fast as 232ms)
   - Support for 50+ languages
   - Advanced reasoning and understanding of visual content

2. **Google Gemini**:

   - Multimodal understanding across text, images, audio, and video
   - Strong performance on complex reasoning tasks
   - Code generation and analysis capabilities

3. **Anthropic Claude 3.7 Sonnet**:

   - High-quality text and image understanding
   - Nuanced reasoning capabilities
   - Strong safety features and reduced hallucinations

4. **LLaVA (Large Language and Vision Assistant)**:
   - Open-source multimodal model
   - Efficient visual reasoning capabilities
   - Customizable for specific use cases

These capabilities inform our design decisions for the chat interface, ensuring we create a UI that can fully leverage the potential of these models while providing an intuitive user experience.

## UI Components

### 1. Chat Container

The main container for the chat interface will be responsive and adapt to different screen sizes:

```tsx
// src/components/chat/chat-container.tsx
import React from "react";
import { cn } from "@/lib/utils";

interface ChatContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function ChatContainer({ children, className }: ChatContainerProps) {
  return (
    <div
      className={cn(
        "flex h-[calc(100vh-4rem)] flex-col rounded-lg border bg-background shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}
```

### 2. Message List

The message list will display conversations with support for different message types:

```tsx
// src/components/chat/message-list.tsx
import React from "react";
import { Message } from "@/types/chat";
import { ChatMessage } from "./chat-message";
import { cn } from "@/lib/utils";

interface MessageListProps {
  messages: Message[];
  className?: string;
  isLoading?: boolean;
}

export function MessageList({ messages, className, isLoading = false }: MessageListProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className={cn("flex-1 space-y-4 overflow-y-auto p-4", className)}>
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
      {isLoading && (
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 animate-pulse rounded-full bg-muted"></div>
          <div className="h-4 w-24 animate-pulse rounded bg-muted"></div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
```

### 3. Chat Message Component

This component will handle different types of message content:

```tsx
// src/components/chat/chat-message.tsx
import React from "react";
import { Message, MessageRole } from "@/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BotIcon, UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/ui/markdown";
import { ImagePreview } from "./image-preview";
import { AudioPlayer } from "./audio-player";

interface ChatMessageProps {
  message: Message;
  className?: string;
}

export function ChatMessage({ message, className }: ChatMessageProps) {
  const isUser = message.role === MessageRole.User;

  return (
    <div
      className={cn(
        "flex items-start gap-3 text-sm",
        isUser ? "justify-end" : "justify-start",
        className
      )}
    >
      {!isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary/10">
            <BotIcon className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-1 rounded-lg px-3 py-2",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {message.content.map((content, index) => {
          if (typeof content === "string") {
            return <Markdown key={index} content={content} />;
          } else if (content.type === "image") {
            return <ImagePreview key={index} src={content.url} alt="Image attachment" />;
          } else if (content.type === "audio") {
            return <AudioPlayer key={index} src={content.url} />;
          }
          return null;
        })}
      </div>

      {isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-primary">
            <UserIcon className="h-4 w-4 text-primary-foreground" />
          </AvatarFallback>
          <AvatarImage src="/avatar.png" alt="User" />
        </Avatar>
      )}
    </div>
  );
}
```

### 4. Input Area with Multimodal Support

The input area will support text, file uploads, and voice input:

```tsx
// src/components/chat/chat-input.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PaperclipIcon, SendIcon, MicIcon, ImageIcon, FileIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTouchGestures } from "@/hooks/use-touch-gestures";

interface ChatInputProps {
  onSend: (message: string, attachments?: File[]) => void;
  isLoading?: boolean;
  className?: string;
}

export function ChatInput({ onSend, isLoading = false, className }: ChatInputProps) {
  const [message, setMessage] = React.useState("");
  const [attachments, setAttachments] = React.useState<File[]>([]);
  const [isRecording, setIsRecording] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (message.trim() || attachments.length > 0) {
      onSend(message, attachments);
      setMessage("");
      setAttachments([]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Recording logic would go here
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    // Stop recording logic would go here
    setIsRecording(false);
  };

  // Use touch gestures for mobile interaction
  useTouchGestures({
    onSwipe: (direction) => {
      if (direction.horizontal === "right" && message.trim()) {
        handleSend();
      }
    },
  });

  return (
    <div className={cn("border-t bg-background p-4", className)}>
      {attachments.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="relative flex items-center rounded-md border bg-muted px-3 py-1 text-xs"
            >
              {file.type.startsWith("image/") ? (
                <ImageIcon className="mr-2 h-3 w-3" />
              ) : (
                <FileIcon className="mr-2 h-3 w-3" />
              )}
              <span className="max-w-[100px] truncate">{file.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="ml-1 h-4 w-4 rounded-full p-0"
                onClick={() => handleRemoveAttachment(index)}
              >
                <XIcon className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-end gap-2">
        <Textarea
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-10 flex-1 resize-none rounded-md border"
          rows={1}
        />

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
          accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
        />

        <Button
          variant="outline"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
        >
          <PaperclipIcon className="h-4 w-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isLoading}
          className={isRecording ? "bg-red-100 text-red-500" : ""}
        >
          <MicIcon className="h-4 w-4" />
        </Button>

        <Button
          variant="default"
          size="icon"
          onClick={handleSend}
          disabled={isLoading || (!message.trim() && attachments.length === 0)}
        >
          <SendIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

### 5. Image Preview Component

For displaying image attachments:

```tsx
// src/components/chat/image-preview.tsx
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ZoomInIcon, ZoomOutIcon, XIcon } from "lucide-react";

interface ImagePreviewProps {
  src: string;
  alt?: string;
  className?: string;
}

export function ImagePreview({ src, alt = "Image", className }: ImagePreviewProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className={cn("relative", className)}>
      <img
        src={src}
        alt={alt}
        className={cn(
          "max-h-60 cursor-pointer rounded-md object-contain",
          isExpanded && "fixed inset-0 z-50 m-auto max-h-[90vh] max-w-[90vw] bg-background/80 p-4"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      />

      {isExpanded && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/80"
            onClick={() => setIsExpanded(false)}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 z-50 rounded-full bg-background/50"
            onClick={() => setIsExpanded(false)}
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="absolute bottom-2 right-2 rounded-full bg-background/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <ZoomOutIcon className="h-4 w-4" /> : <ZoomInIcon className="h-4 w-4" />}
      </Button>
    </div>
  );
}
```

### 6. Audio Player Component

For playing audio attachments:

```tsx
// src/components/chat/audio-player.tsx
import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PlayIcon, PauseIcon } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface AudioPlayerProps {
  src: string;
  className?: string;
}

export function AudioPlayer({ src, className }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const audioRef = React.useRef<HTMLAudioElement>(null);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setProgress(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }

    setIsPlaying(!isPlaying);
  };

  const handleSliderChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = value[0];
    setProgress(value[0]);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <audio ref={audioRef} src={src} preload="metadata" />

      <Button
        variant="ghost"
        size="icon"
        onClick={togglePlayPause}
        className="h-8 w-8 rounded-full"
      >
        {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
      </Button>

      <div className="flex flex-1 items-center gap-2">
        <span className="text-xs tabular-nums">{formatTime(progress)}</span>
        <Slider
          value={[progress]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSliderChange}
          className="flex-1"
        />
        <span className="text-xs tabular-nums">{formatTime(duration)}</span>
      </div>
    </div>
  );
}
```

### 7. Main Chat Page

The main chat page that integrates all components:

```tsx
// src/app/chat/page.tsx
"use client";

import React from "react";
import { useChat } from "ai/react";
import { ChatContainer } from "@/components/chat/chat-container";
import { MessageList } from "@/components/chat/message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { MobileContainer } from "@/components/layout/mobile-container";
import { useAuth } from "@/context/auth-context";
import { Message, MessageRole } from "@/types/chat";

export default function ChatPage() {
  const { user } = useAuth();
  const [attachments, setAttachments] = React.useState<File[]>([]);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    onResponse: (response) => {
      // Handle response
    },
  });

  const handleSendMessage = (message: string, files?: File[]) => {
    if (files && files.length > 0) {
      setAttachments(files);
    }

    // Convert files to data URLs and add to message
    const processAttachments = async () => {
      if (!files || files.length === 0) return [];

      return Promise.all(
        files.map(async (file) => {
          return new Promise<{ type: string; url: string }>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              resolve({
                type: file.type.startsWith("image/") ? "image" : "file",
                url: e.target?.result as string,
              });
            };
            reader.readAsDataURL(file);
          });
        })
      );
    };

    processAttachments().then((attachmentData) => {
      // Here you would normally send the message with attachments to your API
      console.log("Sending message with attachments:", message, attachmentData);

      // For now, just update the UI
      const newMessage: Message = {
        id: Date.now().toString(),
        role: MessageRole.User,
        content: [message, ...attachmentData.map((attachment) => attachment)],
      };

      // Clear attachments after sending
      setAttachments([]);
    });
  };

  return (
    <MobileContainer>
      <ChatContainer>
        <MessageList
          messages={messages.map((msg) => ({
            id: msg.id,
            role: msg.role as MessageRole,
            content: [msg.content],
          }))}
          isLoading={isLoading}
        />
        <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
      </ChatContainer>
    </MobileContainer>
  );
}
```

## Types and Interfaces

Define the necessary types for the chat interface:

```typescript
// src/types/chat.ts
export enum MessageRole {
  User = "user",
  Assistant = "assistant",
  System = "system",
}

export type MessageContent =
  | string
  | { type: "image"; url: string }
  | { type: "audio"; url: string }
  | { type: "video"; url: string }
  | { type: "file"; url: string; name: string };

export interface Message {
  id: string;
  role: MessageRole;
  content: (string | { type: string; url: string; name?: string })[];
  createdAt?: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}
```

## Mobile-First Responsive Design

The chat UI is designed with a mobile-first approach, ensuring it works well on all device sizes:

1. **Small Screens (Mobile)**:

   - Full-width chat container
   - Compact message bubbles
   - Simplified input area with touch-friendly buttons
   - Swipe gestures for common actions

2. **Medium Screens (Tablet)**:

   - Contained chat area with margins
   - Larger message bubbles with more content visible
   - Expanded input area with more options visible

3. **Large Screens (Desktop)**:
   - Maximum width container with ample whitespace
   - Rich message display with expanded media previews
   - Full-featured input area with keyboard shortcuts

## Accessibility Considerations

To ensure the chat interface is accessible to all users:

1. **Multiple Input Methods**:

   - Text input for typing
   - Voice input for speaking
   - File upload for sharing media
   - Touch gestures for mobile interaction

2. **Screen Reader Support**:

   - Proper ARIA labels for all interactive elements
   - Semantic HTML structure
   - Descriptive alt text for images

3. **Keyboard Navigation**:

   - Full keyboard support for all actions
   - Clear focus states
   - Logical tab order

4. **Color Contrast**:
   - High contrast between text and background
   - Visual indicators beyond color alone
   - Dark mode support

## User Experience Enhancements

Additional UX features to improve the chat experience:

1. **Real-time Feedback**:

   - Typing indicators
   - Message delivery status
   - Read receipts

2. **Context Awareness**:

   - Adapting to user's device capabilities
   - Remembering conversation context
   - Suggesting relevant actions based on context

3. **Progressive Enhancement**:

   - Core functionality works without JavaScript
   - Enhanced features added when available
   - Fallbacks for unsupported features

4. **Performance Optimization**:
   - Lazy loading of media
   - Virtualized message list for long conversations
   - Efficient rendering of markdown and code blocks

## Integration with Fast-Agent

The chat UI is designed to integrate seamlessly with Fast-Agent in the next implementation phase:

1. **Message Handling**:

   - Support for structured message formats required by Fast-Agent
   - Ability to display agent thinking and reasoning steps
   - Handling of tool calls and results

2. **Streaming Responses**:

   - Support for streaming partial responses
   - Displaying typing indicators during processing
   - Handling of long-running operations

3. **Tool Integration**:
   - UI components for displaying tool usage
   - Visual differentiation between user, agent, and tool messages
   - Interactive elements for tool parameters

## Conclusion

This multimodal chat UI design provides a comprehensive foundation for building a high-quality chat interface that supports multiple modes of interaction. The design is informed by UX research, multimodal design best practices, and an analysis of leading multimodal AI models.

The implementation follows a mobile-first approach, ensuring the interface works well on all device sizes while maintaining accessibility and providing a rich user experience. The design is also prepared for integration with Fast-Agent in the next implementation phase.

By implementing this design, we will create a chat interface that not only meets the requirements of the project but also provides an intuitive and engaging experience for users interacting with MCP servers through the Next.js PWA.
