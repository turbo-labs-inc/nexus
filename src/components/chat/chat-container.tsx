"use client";

import { useState, useRef, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import { ChatMessage, ChatMessageProps } from "./chat-message";
import { ChatInput } from "./chat-input";

export interface ChatContainerProps {
  className?: string;
  messages: ChatMessageProps[];
  isLoading?: boolean;
  onSendMessage: (message: string, attachments?: File[]) => void;
  onRecordAudio?: (audio: Blob) => void;
  initialPrompt?: string;
  welcomeMessage?: string;
  emptyStateMessage?: string;
  isLoadingInitial?: boolean;
}

export function ChatContainer({
  className,
  messages,
  isLoading,
  onSendMessage,
  onRecordAudio,
  initialPrompt,
  welcomeMessage = "Hi there! How can I help you today?",
  emptyStateMessage = "Start a conversation by sending a message below.",
  isLoadingInitial = false,
}: ChatContainerProps) {
  const [hasUserMessaged, setHasUserMessaged] = useState(messages.some(msg => msg.role === "user"));
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [bottomAnchorRef, isBottomInView] = useInView();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScroll]);

  // Handle manual scroll to control auto-scrolling
  useEffect(() => {
    setAutoScroll(isBottomInView);
  }, [isBottomInView]);

  // Handle initial message send
  const handleSendMessage = (text: string, attachments?: File[]) => {
    setHasUserMessaged(true);
    onSendMessage(text, attachments);
  };

  return (
    <div className={cn("flex h-[calc(100dvh-4rem)] md:h-full flex-col", className)}>
      {/* Messages container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4 pt-0"
      >
        {/* Welcome message or empty state */}
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            {isLoadingInitial ? (
              <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
                <p className="text-muted-foreground">Loading conversation...</p>
              </div>
            ) : (
              <>
                <h3 className="text-xl font-semibold">Welcome to Nexus</h3>
                <p className="mt-2 max-w-md text-muted-foreground">{emptyStateMessage}</p>
              </>
            )}
          </div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div className="space-y-0 divide-y divide-border">
            {/* Welcome message if no user messages yet */}
            {!hasUserMessaged && welcomeMessage && (
              <ChatMessage
                role="assistant"
                content={welcomeMessage}
                timestamp={new Date()}
              />
            )}

            {/* Render messages */}
            {messages.map((message, index) => (
              <ChatMessage
                key={index}
                {...message}
                timestamp={message.timestamp || new Date()}
              />
            ))}

            {/* Loading message */}
            {isLoading && (
              <ChatMessage
                role="assistant"
                content="..."
                isLoading={true}
                timestamp={new Date()}
              />
            )}
          </div>
        )}

        {/* Bottom anchor for checking if user has scrolled to bottom */}
        <div ref={bottomAnchorRef} className="h-1 w-full"></div>
        
        {/* Invisible element for scrolling to bottom */}
        <div ref={messagesEndRef}></div>
      </div>

      {/* Input area */}
      <div className="border-t border-border">
        <ChatInput 
          onSendMessage={handleSendMessage} 
          isDisabled={isLoading || isLoadingInitial}
          initialPrompt={initialPrompt}
          onRecordAudio={onRecordAudio}
        />
      </div>
    </div>
  );
}