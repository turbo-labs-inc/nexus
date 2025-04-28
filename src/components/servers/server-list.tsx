"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMCP } from "@/context/mcp-context";
import { MCPServerConfig } from "@/lib/mcp/types";
import { useServerStatus } from "@/lib/mcp/hooks/use-server-status";

// Status Badge Component
function StatusBadge({ serverId }: { serverId: string }) {
  const { status } = useServerStatus(serverId);
  
  return (
    <Badge
      variant={
        status === "online" ? "default" :
        status === "offline" ? "outline" :
        status === "error" ? "destructive" : "secondary"
      }
    >
      {status}
    </Badge>
  );
}

// Server Card Component
function ServerCard({ server }: { server: MCPServerConfig }) {
  const { connectToServer, disconnectFromServer } = useMCP();
  const { status, isOnline, isOffline } = useServerStatus(server.id);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  
  // Handle connect button click
  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connectToServer(server.id);
    } catch (error) {
      console.error("Error connecting to server:", error);
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Handle disconnect button click
  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await disconnectFromServer(server.id);
    } catch (error) {
      console.error("Error disconnecting from server:", error);
    } finally {
      setIsDisconnecting(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{server.name}</CardTitle>
          <StatusBadge serverId={server.id} />
        </div>
        <CardDescription>
          {server.description || "No description available"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm">
          <p><span className="font-semibold">URL:</span> {server.url}</p>
          <p>
            <span className="font-semibold">Capabilities:</span>{" "}
            {server.capabilities.length}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant={isOnline ? "destructive" : "default"}
          size="sm"
          onClick={isOnline ? handleDisconnect : handleConnect}
          disabled={isConnecting || isDisconnecting || status === "error"}
        >
          {isConnecting ? "Connecting..." : 
           isDisconnecting ? "Disconnecting..." : 
           isOnline ? "Disconnect" : "Connect"}
        </Button>
        
        <Button variant="outline" size="sm" asChild>
          <Link href={`/servers/${server.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

// Main Server List Component
export function ServerList() {
  const { servers, isLoading, error } = useMCP();
  
  if (isLoading) {
    return (
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="w-full h-[200px] animate-pulse bg-muted"></Card>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 rounded-md bg-destructive/10 text-destructive">
        Error loading servers: {error}
      </div>
    );
  }
  
  if (servers.length === 0) {
    return (
      <div className="p-8 text-center rounded-md border border-dashed">
        <h3 className="text-lg font-medium mb-2">No MCP Servers</h3>
        <p className="text-muted-foreground mb-4">
          You haven't registered any MCP servers yet.
        </p>
        <Button asChild>
          <Link href="/servers/new">Add MCP Server</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {servers.map((server) => (
        <ServerCard key={server.id} server={server} />
      ))}
    </div>
  );
}