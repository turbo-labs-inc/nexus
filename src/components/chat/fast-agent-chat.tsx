"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFastAgent, MessageType } from "@/lib/fast-agent";

export interface FastAgentChatProps {
  serverUrl?: string;
  autoConnect?: boolean;
}

export function FastAgentChat({
  serverUrl = "ws://localhost:8000/ws",
  autoConnect = true,
}: FastAgentChatProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
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
  } = useFastAgent({ url: serverUrl });

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
          <CardTitle>Fast-Agent Chat</CardTitle>
          {isConnected && (
            <p className="text-xs text-muted-foreground mt-1">
              Connected to server at {serverUrl}
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
                  message.type === MessageType.HISTORY_RESPONSE
                ) {
                  return null;
                }

                const isUser = message.type === MessageType.USER_MESSAGE;
                const content = message.data?.content || "";

                return (
                  <div
                    key={message.messageId}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        isUser ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
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
