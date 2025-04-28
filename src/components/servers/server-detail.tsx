"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { useMCP } from "@/context/mcp-context";
import { MCPServerConfig, MCPCapability } from "@/lib/mcp/types";
import { useServerStatus } from "@/lib/mcp/hooks/use-server-status";
import { useSupabaseClient } from "@/lib/supabase/client";

// Capability Item Component
function CapabilityItem({ capability }: { capability: MCPCapability }) {
  return (
    <div className="border rounded-md p-4 mb-2">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium">{capability.name}</h3>
        <Badge>{capability.type}</Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-2">
        {capability.description || "No description available"}
      </p>
      <div className="text-xs text-muted-foreground">
        Version: {capability.version}
      </div>
    </div>
  );
}

// Server Detail Component
export function ServerDetail({ server }: { server: MCPServerConfig }) {
  const { 
    unregisterServer,
    connectToServer,
    disconnectFromServer,
    getCapabilitiesByServer,
  } = useMCP();
  const router = useRouter();
  const supabase = useSupabaseClient();
  const { status, isOnline, isOffline, lastChecked, errorMessage } = useServerStatus(server.id);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Get capabilities by type
  const tools = getCapabilitiesByServer(server.id).filter(c => c.type === "tool");
  const resources = getCapabilitiesByServer(server.id).filter(c => c.type === "resource");
  const prompts = getCapabilitiesByServer(server.id).filter(c => c.type === "prompt");
  
  // Format date
  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString();
  };
  
  // Handle connect button click
  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connectToServer(server.id);
      toast.success("Successfully connected to server");
    } catch (error: any) {
      console.error("Error connecting to server:", error);
      toast.error("Failed to connect to server: " + (error.message || "Unknown error"));
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Handle disconnect button click
  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await disconnectFromServer(server.id);
      toast.success("Successfully disconnected from server");
    } catch (error: any) {
      console.error("Error disconnecting from server:", error);
      toast.error("Failed to disconnect from server: " + (error.message || "Unknown error"));
    } finally {
      setIsDisconnecting(false);
    }
  };
  
  // Handle delete button click
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // First disconnect if connected
      if (isOnline) {
        await disconnectFromServer(server.id);
      }
      
      // Unregister the server
      unregisterServer(server.id);
      
      // Delete from Supabase
      const { error } = await supabase
        .from("mcp_configs")
        .delete()
        .eq("id", server.id);
      
      if (error) {
        throw error;
      }
      
      toast.success("Server deleted successfully");
      router.push("/servers");
    } catch (error: any) {
      console.error("Error deleting server:", error);
      toast.error("Failed to delete server: " + (error.message || "Unknown error"));
    } finally {
      setIsDeleting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{server.name}</h1>
          <p className="text-muted-foreground">
            {server.description || "No description available"}
          </p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant={isOnline ? "destructive" : "default"}
            onClick={isOnline ? handleDisconnect : handleConnect}
            disabled={isConnecting || isDisconnecting || status === "error" || isDeleting}
          >
            {isConnecting ? "Connecting..." : 
             isDisconnecting ? "Disconnecting..." : 
             isOnline ? "Disconnect" : "Connect"}
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete this MCP server configuration.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button variant="outline" asChild>
            <Link href={`/servers/${server.id}/edit`}>Edit</Link>
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Server Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="font-medium">Status</dt>
              <dd>
                <Badge
                  variant={
                    status === "online" ? "default" :
                    status === "offline" ? "outline" :
                    status === "error" ? "destructive" : "secondary"
                  }
                >
                  {status}
                </Badge>
              </dd>
            </div>
            
            <div>
              <dt className="font-medium">Last Checked</dt>
              <dd>{formatDate(lastChecked)}</dd>
            </div>
            
            <div>
              <dt className="font-medium">URL</dt>
              <dd>{server.url}</dd>
            </div>
            
            <div>
              <dt className="font-medium">API Key</dt>
              <dd>{server.apiKey ? "••••••••" : "Not set"}</dd>
            </div>
            
            <div>
              <dt className="font-medium">Created</dt>
              <dd>{formatDate(server.createdAt)}</dd>
            </div>
            
            <div>
              <dt className="font-medium">Last Updated</dt>
              <dd>{formatDate(server.updatedAt)}</dd>
            </div>
          </dl>
          
          {status === "error" && errorMessage && (
            <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-md">
              <h3 className="font-medium">Error</h3>
              <p>{errorMessage}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Capabilities</CardTitle>
          <CardDescription>
            This server has {server.capabilities.length} registered capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">
                All ({server.capabilities.length})
              </TabsTrigger>
              <TabsTrigger value="tools">
                Tools ({tools.length})
              </TabsTrigger>
              <TabsTrigger value="resources">
                Resources ({resources.length})
              </TabsTrigger>
              <TabsTrigger value="prompts">
                Prompts ({prompts.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {server.capabilities.length === 0 ? (
                <div className="text-center p-4 text-muted-foreground">
                  No capabilities found for this server
                </div>
              ) : (
                <div className="space-y-2">
                  {server.capabilities.map((capability) => (
                    <CapabilityItem
                      key={capability.id}
                      capability={capability}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="tools">
              {tools.length === 0 ? (
                <div className="text-center p-4 text-muted-foreground">
                  No tools found for this server
                </div>
              ) : (
                <div className="space-y-2">
                  {tools.map((tool) => (
                    <CapabilityItem key={tool.id} capability={tool} />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="resources">
              {resources.length === 0 ? (
                <div className="text-center p-4 text-muted-foreground">
                  No resources found for this server
                </div>
              ) : (
                <div className="space-y-2">
                  {resources.map((resource) => (
                    <CapabilityItem key={resource.id} capability={resource} />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="prompts">
              {prompts.length === 0 ? (
                <div className="text-center p-4 text-muted-foreground">
                  No prompts found for this server
                </div>
              ) : (
                <div className="space-y-2">
                  {prompts.map((prompt) => (
                    <CapabilityItem key={prompt.id} capability={prompt} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <Button variant="outline" disabled={!isOnline} className="w-full">
            Refresh Capabilities
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}