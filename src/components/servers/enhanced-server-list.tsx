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
import { 
  AlertCircle, 
  Check, 
  Cpu, 
  Database, 
  FileText, 
  Globe, 
  MessageSquare, 
  Search, 
  Settings, 
  Tool, 
  Wand2 
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMCP } from "@/context/mcp-context";
import { MCPCapability, MCPServerConfig } from "@/lib/mcp/types";
import { useServerStatus } from "@/lib/mcp/hooks/use-server-status";

// Predefined list of popular models
const popularModels = [
  { name: "Claude", provider: "Anthropic", types: ["chat", "completion"] },
  { name: "GPT-4", provider: "OpenAI", types: ["chat", "completion", "vision"] },
  { name: "Gemini", provider: "Google", types: ["chat", "multimodal"] },
  { name: "Llama 2", provider: "Meta", types: ["chat", "completion"] },
  { name: "Mistral", provider: "Mistral AI", types: ["chat", "completion"] },
];

// Helper function to get icon for capability type
function getCapabilityIcon(type: string) {
  switch (type) {
    case "tool":
      return <Tool className="h-4 w-4" />;
    case "resource":
      return <Database className="h-4 w-4" />;
    case "prompt":
      return <MessageSquare className="h-4 w-4" />;
    case "model":
      return <Cpu className="h-4 w-4" />;
    case "component":
      return <Settings className="h-4 w-4" />;
    case "search":
      return <Search className="h-4 w-4" />;
    case "web":
      return <Globe className="h-4 w-4" />;
    case "document":
      return <FileText className="h-4 w-4" />;
    default:
      return <Wand2 className="h-4 w-4" />;
  }
}

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
      className="font-semibold"
    >
      {status === "online" && <Check className="mr-1 h-3 w-3" />}
      {status === "error" && <AlertCircle className="mr-1 h-3 w-3" />}
      {status}
    </Badge>
  );
}

// Capability Badge Component
function CapabilityBadge({ type }: { type: string }) {
  return (
    <Badge 
      variant="outline" 
      className="flex items-center gap-1 bg-muted/30"
    >
      {getCapabilityIcon(type)}
      {type}
    </Badge>
  );
}

// Tool Card Component
function ToolCard({ capability }: { capability: MCPCapability }) {
  return (
    <Card className="overflow-hidden shadow-sm transition-all hover:shadow-md">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{capability.name}</CardTitle>
          <CapabilityBadge type={capability.type} />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {capability.description || "No description available"}
        </p>
      </CardContent>
    </Card>
  );
}

// Server Card Component with Tools display
function EnhancedServerCard({ server }: { server: MCPServerConfig }) {
  const { connectToServer, disconnectFromServer, getCapabilitiesByServer } = useMCP();
  const { status, isOnline, isOffline } = useServerStatus(server.id);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  
  // Get capabilities for this server
  const capabilities = getCapabilitiesByServer(server.id);
  
  // Filter capabilities by type
  const tools = capabilities.filter(cap => cap.type === "tool");
  const resources = capabilities.filter(cap => cap.type === "resource");
  const prompts = capabilities.filter(cap => cap.type === "prompt");
  
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
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle>{server.name}</CardTitle>
          <StatusBadge serverId={server.id} />
        </div>
        <CardDescription>
          {server.description || "No description available"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-4 pb-0">
        <Tabs defaultValue="tools" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="tools">
              Tools <Badge variant="outline" className="ml-2">{tools.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="resources">
              Resources <Badge variant="outline" className="ml-2">{resources.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="prompts">
              Prompts <Badge variant="outline" className="ml-2">{prompts.length}</Badge>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="tools" className="mt-0">
            {tools.length > 0 ? (
              <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                {tools.slice(0, 3).map((tool) => (
                  <ToolCard key={tool.id} capability={tool} />
                ))}
                {tools.length > 3 && (
                  <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                    <Link href={`/servers/${server.id}?tab=tools`}>
                      View {tools.length - 3} more tool{tools.length - 3 !== 1 ? 's' : ''}
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No tools available.
              </p>
            )}
          </TabsContent>
          
          <TabsContent value="resources" className="mt-0">
            {resources.length > 0 ? (
              <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                {resources.slice(0, 3).map((resource) => (
                  <ToolCard key={resource.id} capability={resource} />
                ))}
                {resources.length > 3 && (
                  <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                    <Link href={`/servers/${server.id}?tab=resources`}>
                      View {resources.length - 3} more resource{resources.length - 3 !== 1 ? 's' : ''}
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No resources available.
              </p>
            )}
          </TabsContent>
          
          <TabsContent value="prompts" className="mt-0">
            {prompts.length > 0 ? (
              <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                {prompts.slice(0, 3).map((prompt) => (
                  <ToolCard key={prompt.id} capability={prompt} />
                ))}
                {prompts.length > 3 && (
                  <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                    <Link href={`/servers/${server.id}?tab=prompts`}>
                      View {prompts.length - 3} more prompt{prompts.length - 3 !== 1 ? 's' : ''}
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No prompts available.
              </p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between p-4">
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
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/servers/${server.id}/edit`}>Edit</Link>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/servers/${server.id}`}>Details</Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

// Enhanced model card with selection capability
function EnhancedModelCard({ model }: { model: typeof popularModels[0] }) {
  const [isSelected, setIsSelected] = useState(false);
  
  return (
    <Card className={`w-full cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`} onClick={() => setIsSelected(!isSelected)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{model.name}</CardTitle>
          <Badge>{model.provider}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex flex-wrap gap-1">
          {model.types.map(type => (
            <Badge key={type} variant="outline">{type}</Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <div className="w-full">
          <Button variant={isSelected ? "default" : "outline"} size="sm" className="w-full" onClick={() => setIsSelected(!isSelected)}>
            {isSelected ? "Selected" : "Select Model"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

// Main Enhanced Server List Component
export function EnhancedServerList() {
  const { servers, isLoading, error } = useMCP();
  const [view, setView] = useState<"servers" | "models" | "tools">("servers");
  
  const displayOptions = (
    <div className="mb-6">
      <Tabs defaultValue="servers" onValueChange={(value) => setView(value as "servers" | "models" | "tools")}>
        <TabsList className="mb-0">
          <TabsTrigger value="servers">MCP Servers</TabsTrigger>
          <TabsTrigger value="models">AI Models</TabsTrigger>
          <TabsTrigger value="tools">Available Tools</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
  
  if (isLoading) {
    return (
      <>
        {displayOptions}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="w-full h-[300px] animate-pulse bg-muted"></Card>
          ))}
        </div>
      </>
    );
  }
  
  if (error) {
    return (
      <>
        {displayOptions}
        <div className="p-4 rounded-md bg-destructive/10 text-destructive">
          Error loading configuration: {error}
        </div>
      </>
    );
  }
  
  // Models view
  if (view === "models") {
    return (
      <>
        {displayOptions}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {popularModels.map((model, index) => (
            <EnhancedModelCard key={index} model={model} />
          ))}
        </div>
      </>
    );
  }
  
  // Tools view - aggregate all tools across servers
  if (view === "tools") {
    // Get all capabilities
    let allCapabilities: MCPCapability[] = [];
    servers.forEach(server => {
      const capabilities = useMCP().getCapabilitiesByServer(server.id);
      allCapabilities = [...allCapabilities, ...capabilities];
    });
    
    // Filter to just tools
    const tools = allCapabilities.filter(cap => cap.type === "tool");
    
    return (
      <>
        {displayOptions}
        {tools.length > 0 ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tools.map((tool) => (
              <ToolCard key={tool.id} capability={tool} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center rounded-md border border-dashed">
            <h3 className="text-lg font-medium mb-2">No Tools Available</h3>
            <p className="text-muted-foreground mb-4">
              Connect to an MCP server to access tools.
            </p>
            <Button asChild>
              <Link href="/servers/new">Add MCP Server</Link>
            </Button>
          </div>
        )}
      </>
    );
  }
  
  // Servers view
  if (servers.length === 0) {
    return (
      <>
        {displayOptions}
        <div className="p-8 text-center rounded-md border border-dashed">
          <h3 className="text-lg font-medium mb-2">No MCP Servers</h3>
          <p className="text-muted-foreground mb-4">
            You haven't registered any MCP servers yet.
          </p>
          <Button asChild>
            <Link href="/servers/new">Add MCP Server</Link>
          </Button>
        </div>
      </>
    );
  }
  
  return (
    <>
      {displayOptions}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {servers.map((server) => (
          <EnhancedServerCard key={server.id} server={server} />
        ))}
      </div>
    </>
  );
}