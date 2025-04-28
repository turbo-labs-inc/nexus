"use client";

import { useState, useEffect } from "react";
import { MCPSlackIntegration, SlackIncomingMessage } from "@/lib/mcp/types";
import { useSlack } from "@/lib/mcp/hooks/use-slack";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Hash, User, Bot, Send, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface MessageItemProps {
  message: SlackIncomingMessage;
}

function MessageItem({ message }: MessageItemProps) {
  return (
    <div className="flex gap-3 py-3">
      <Avatar className="h-8 w-8">
        {message.user.isBot ? (
          <AvatarFallback className="bg-purple-100 text-purple-800">
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        ) : (
          <>
            <AvatarImage src={`https://ui-avatars.com/api/?name=${message.user.name}&background=random`} />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </>
        )}
      </Avatar>
      <div className="space-y-1 flex-1">
        <div className="flex items-start gap-1">
          <span className="font-medium text-sm">{message.user.name}</span>
          <span className="text-xs text-muted-foreground">
            {format(new Date(Number(message.ts) * 1000), "h:mm a")}
          </span>
          {message.type === "mention" && <Badge variant="outline" className="text-xs px-1 h-5">Mention</Badge>}
        </div>
        <p className="text-sm">{message.text}</p>
      </div>
    </div>
  );
}

interface SlackChannelViewProps {
  integrationId: string;
  channelId?: string;
}

export function SlackChannelView({ integrationId, channelId }: SlackChannelViewProps) {
  const { getIntegration, getChannels, messages, sendTextMessage, isSending } = useSlack();
  const [integration, setIntegration] = useState<MCPSlackIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(channelId || null);
  const [messageText, setMessageText] = useState("");
  const [filteredMessages, setFilteredMessages] = useState<SlackIncomingMessage[]>([]);
  
  // In a real app, this would use data from the API
  // Here we'll use mock data
  useEffect(() => {
    const fetchIntegration = async () => {
      try {
        // In a real implementation, this would be fetched from the database
        const mockIntegration: MCPSlackIntegration = {
          id: integrationId,
          type: "slack",
          name: "Demo Workspace",
          description: "Demo Slack workspace",
          version: "1.0.0",
          schema: {},
          serverId: "local",
          isActive: true,
          workspaceId: "W12345",
          workspaceName: "Demo Company",
          botName: "NexusBot",
          channels: [
            { id: "C01", name: "general", isPrivate: false },
            { id: "C02", name: "random", isPrivate: false },
            { id: "C03", name: "dev", isPrivate: false }
          ],
          apiConfig: {
            botToken: "xoxb-...",
            signingSecret: "...",
            appId: "A...",
            clientId: "...",
            clientSecret: "...",
            verificationToken: "..."
          },
          authConfig: {
            scopes: ["channels:history", "chat:write"],
            redirectUri: "",
            installationStore: ""
          }
        };
        
        setIntegration(mockIntegration);
        if (!selectedChannel && mockIntegration.channels.length > 0) {
          setSelectedChannel(mockIntegration.channels[0].id);
        }
        
        // Generate mock messages
        const mockMessages: SlackIncomingMessage[] = Array.from({ length: 20 }).map((_, i) => ({
          type: i % 5 === 0 ? "mention" : "message",
          user: {
            id: i % 3 === 0 ? "U001" : i % 3 === 1 ? "U002" : "U003",
            name: i % 3 === 0 ? "John Doe" : i % 3 === 1 ? "Jane Smith" : "NexusBot",
            isBot: i % 3 === 2
          },
          channel: {
            id: i % 3 === 0 ? "C01" : i % 3 === 1 ? "C02" : "C03",
            name: i % 3 === 0 ? "general" : i % 3 === 1 ? "random" : "dev",
            isPrivate: false
          },
          text: `This is a sample message ${i + 1} in the ${i % 3 === 0 ? "general" : i % 3 === 1 ? "random" : "dev"} channel`,
          ts: `${Math.floor(Date.now() / 1000) - i * 300}`,
          threadTs: i % 4 === 0 ? `${Math.floor(Date.now() / 1000) - i * 300 - 10}` : undefined
        }));
        
        // Sort messages by timestamp (newest first)
        setFilteredMessages(mockMessages.sort((a, b) => Number(b.ts) - Number(a.ts)));
      } catch (error) {
        console.error("Error loading Slack integration:", error);
        toast.error("Could not load Slack integration");
      } finally {
        setLoading(false);
      }
    };
    
    fetchIntegration();
  }, [integrationId, selectedChannel]);
  
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedChannel) return;
    
    try {
      // In a real app, this would call the sendMessage function
      // Here we'll just show a success toast
      toast.success("Message sent to Slack");
      
      // Add the message to our local state to simulate sending
      const newMessage: SlackIncomingMessage = {
        type: "message",
        user: {
          id: "U003", 
          name: "NexusBot",
          isBot: true
        },
        channel: {
          id: selectedChannel,
          name: integration?.channels.find(c => c.id === selectedChannel)?.name || "unknown",
          isPrivate: false
        },
        text: messageText,
        ts: `${Math.floor(Date.now() / 1000)}`
      };
      
      setFilteredMessages([newMessage, ...filteredMessages]);
      setMessageText("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };
  
  const refreshMessages = () => {
    toast.success("Messages refreshed");
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!integration) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Slack Integration Not Found</CardTitle>
          <CardDescription>
            The requested Slack integration could not be found or has been removed.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Find channel info
  const channel = integration.channels.find(c => c.id === selectedChannel);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Hash className="h-5 w-5" />
          {channel ? channel.name : "Select a channel"}
        </CardTitle>
        <CardDescription className="flex justify-between items-center">
          <span>{integration.workspaceName}</span>
          <div className="flex gap-2">
            <select 
              className="text-xs border rounded-md px-2 py-1 bg-background"
              value={selectedChannel || ""}
              onChange={(e) => setSelectedChannel(e.target.value)}
            >
              {integration.channels.map(c => (
                <option key={c.id} value={c.id}>
                  #{c.name}
                </option>
              ))}
            </select>
            <Button size="sm" variant="ghost" onClick={refreshMessages}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-1 divide-y">
            {filteredMessages.length > 0 ? (
              filteredMessages.map((message, index) => (
                <MessageItem key={`${message.ts}-${index}`} message={message} />
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">No messages in this channel</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <form 
          className="flex w-full gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
        >
          <Input
            placeholder={`Message #${channel?.name || 'channel'}`}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            disabled={!selectedChannel || isSending}
          />
          <Button type="submit" disabled={!messageText.trim() || !selectedChannel || isSending}>
            <Send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
