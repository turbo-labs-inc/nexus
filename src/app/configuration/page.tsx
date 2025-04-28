"use client";

import { useState, useRef, useEffect } from "react";
import { Cog, Server, Bot, Database, Workflow, LayoutDashboard, ChevronRight, Key } from "lucide-react";
import { cn } from "@/lib/utils";
import { MCPProvider } from "@/context/mcp-context";
import { ModelList } from "@/components/models";
import { EnhancedServerList } from "@/components/servers/enhanced-server-list";
import { SlackList } from "@/components/slack";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useMCP } from "@/context/mcp-context";
import { useModel } from "@/lib/mcp/hooks/use-model";

// Section component for configuration sections
function ConfigSection({ 
  id,
  title, 
  description,
  icon,
  children,
  className
}: { 
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={cn("py-10 scroll-mt-6", className)}>
      <div className="flex items-center gap-2 mb-2">
        <div className="p-2 rounded-md bg-primary/10">{icon}</div>
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      {description && <p className="text-muted-foreground mb-6">{description}</p>}
      {children}
    </section>
  );
}

// Navigation item component
function NavItem({ 
  targetId, 
  label, 
  icon,
  activeSection,
  onClick
}: { 
  targetId: string;
  label: string;
  icon: React.ReactNode;
  activeSection: string;
  onClick: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onClick(targetId)}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-3 text-sm w-full transition-colors",
        activeSection === targetId
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {icon}
      <span>{label}</span>
      <ChevronRight className="ml-auto h-4 w-4" />
    </button>
  );
}

// Model configuration card with API key input
function ModelConfigCard({ model }) {
  const [apiKey, setApiKey] = useState(model.apiConfig?.apiKey || "");
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleSave = () => {
    // Here you'd implement the save functionality
    console.log(`Saving API key for model ${model.id}: ${apiKey}`);
    // Show success message
    alert(`API key for ${model.name} saved successfully`);
  };
  
  return (
    <Card className="w-full mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">{model.name}</CardTitle>
            <CardDescription>
              {model.provider} {model.contextWindow ? `· ${model.contextWindow.toLocaleString()} tokens` : ''}
            </CardDescription>
          </div>
          <Badge variant={apiKey ? "default" : "outline"}>
            {apiKey ? "Configured" : "Not Configured"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor={`api-key-${model.id}`} className="mb-2 block">API Key</Label>
            <div className="flex gap-2">
              <Input
                id={`api-key-${model.id}`}
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`Enter ${model.provider} API key`}
                className="flex-1"
              />
              <Button onClick={handleSave} disabled={!apiKey}>Save</Button>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            className="text-xs w-full" 
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Hide Details" : "Show Details"}
          </Button>
          
          {isExpanded && (
            <div className="space-y-3 pt-2 border-t">
              {model.supportedFeatures && model.supportedFeatures.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Features</p>
                  <div className="flex flex-wrap gap-1">
                    {model.supportedFeatures.map((feature) => (
                      <Badge key={feature} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {model.supportedModalities && model.supportedModalities.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Modalities</p>
                  <div className="flex flex-wrap gap-1">
                    {model.supportedModalities.map((modality) => (
                      <Badge key={modality} variant="secondary" className="text-xs">
                        {modality}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Default Parameters</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor={`temperature-${model.id}`} className="text-xs">Temperature</Label>
                    <Input 
                      id={`temperature-${model.id}`}
                      type="number" 
                      min="0" 
                      max="1" 
                      step="0.1"
                      defaultValue={model.defaultParameters?.temperature || 0.7}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`max-tokens-${model.id}`} className="text-xs">Max Tokens</Label>
                    <Input 
                      id={`max-tokens-${model.id}`}
                      type="number"
                      defaultValue={model.maxOutputTokens || 2048}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Server configuration with associated tools
function ServerConfigWithTools({ server, getCapabilitiesByServer }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Get capabilities for this server
  const capabilities = getCapabilitiesByServer ? getCapabilitiesByServer(server.id) : [];
  
  // Filter capabilities by type
  const tools = capabilities.filter(cap => cap.type === "tool");
  
  return (
    <Card className="w-full mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">{server.name}</CardTitle>
            <CardDescription>{server.description || "MCP Server"}</CardDescription>
          </div>
          <Badge variant={server.status === "online" ? "default" : "outline"}>
            {server.status || "Offline"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor={`server-url-${server.id}`} className="mb-2 block">Server URL</Label>
            <Input
              id={`server-url-${server.id}`}
              defaultValue={server.url}
              placeholder="https://example.com/api"
              className="flex-1"
            />
          </div>
          
          <div>
            <Label htmlFor={`server-key-${server.id}`} className="mb-2 block">API Key</Label>
            <div className="flex gap-2">
              <Input
                id={`server-key-${server.id}`}
                type="password"
                defaultValue={server.apiKey}
                placeholder="Enter MCP server API key"
                className="flex-1"
              />
              <Button>Save</Button>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            className="text-xs w-full" 
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? "Hide Tools" : `Show Available Tools (${tools.length})`}
          </Button>
          
          {isExpanded && tools.length > 0 && (
            <div className="space-y-3 pt-2 border-t">
              <p className="text-sm text-muted-foreground mb-2">Available Tools</p>
              {tools.map(tool => (
                <div key={tool.id} className="p-3 border rounded-md">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium">{tool.name}</h4>
                      <p className="text-xs text-muted-foreground">{tool.description || "No description"}</p>
                    </div>
                    <Switch id={`tool-${tool.id}`} defaultChecked={true} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Supabase-specific configuration example
function SupabaseServerConfig() {
  return (
    <Card className="w-full mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg">Supabase</CardTitle>
            <CardDescription>Database and authentication service</CardDescription>
          </div>
          <Badge variant="default">Connected</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="supabase-url" className="mb-2 block">Project URL</Label>
            <Input
              id="supabase-url"
              defaultValue="https://yggwxqipshcuxraklvzb.supabase.co"
              className="flex-1"
            />
          </div>
          
          <div>
            <Label htmlFor="supabase-key" className="mb-2 block">Anon Key</Label>
            <div className="flex gap-2">
              <Input
                id="supabase-key"
                type="password"
                defaultValue="eyJhbGciOiJIUzI1NiIsInR..."
                className="flex-1"
              />
              <Button>Save</Button>
            </div>
          </div>
          
          <div className="p-3 border rounded-md bg-muted/50">
            <h4 className="font-medium mb-2">Available Tools</h4>
            <div className="space-y-2">
              {[
                { id: "execute_sql", name: "Execute SQL", description: "Run SQL queries against your database" },
                { id: "list_tables", name: "List Tables", description: "Get all tables in the database" },
                { id: "auth", name: "Authentication", description: "User authentication and management" },
                { id: "storage", name: "Storage", description: "File storage operations" }
              ].map(tool => (
                <div key={tool.id} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">{tool.name}</p>
                    <p className="text-xs text-muted-foreground">{tool.description}</p>
                  </div>
                  <Switch id={`supabase-tool-${tool.id}`} defaultChecked={true} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Fallback models for when no models are available
const FALLBACK_MODELS = [
  {
    id: "claude-3-opus",
    name: "Claude 3 Opus",
    provider: "Anthropic",
    contextWindow: 200000,
    maxOutputTokens: 4096,
    supportedFeatures: ["chat", "completion", "vision", "function_calling"],
    supportedModalities: ["text", "image"],
    defaultParameters: { temperature: 0.7 }
  },
  {
    id: "gpt-4",
    name: "GPT-4 Turbo",
    provider: "OpenAI",
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportedFeatures: ["chat", "completion", "vision", "function_calling"],
    supportedModalities: ["text", "image"],
    defaultParameters: { temperature: 0.7 }
  }
];

// Main Configuration Page Content (inside MCPProvider)
function ConfigContent() {
  const [activeSection, setActiveSection] = useState("general");
  
  // Use fallback models if useModel() hook fails or returns empty array
  let modelData = { models: [] };
  try {
    modelData = useModel();
  } catch (error) {
    console.error("Failed to use model hook:", error);
  }
  
  const models = modelData.models && modelData.models.length > 0 ? modelData.models : FALLBACK_MODELS;
  const { servers, getCapabilitiesByServer } = useMCP();
  
  // Refs for each section
  const sectionRefs = {
    general: useRef(null),
    models: useRef(null),
    servers: useRef(null),
    integrations: useRef(null),
    workflows: useRef(null)
  };
  
  // Handle navigation click
  const handleNavClick = (sectionId) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Intersection Observer to detect which section is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3 }
    );
    
    // Observe all section elements
    const sections = document.querySelectorAll('section[id]');
    sections.forEach(section => {
      observer.observe(section);
    });
    
    return () => {
      sections.forEach(section => {
        observer.unobserve(section);
      });
    };
  }, []);
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-2">Configuration</h1>
      <p className="text-muted-foreground mb-6">
        Manage your AI models, servers, and integration settings
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Left sticky navigation */}
        <aside className="md:col-span-1">
          <div className="sticky top-6 rounded-lg border shadow-sm">
            <div className="p-4 border-b">
              <h3 className="font-medium">Settings</h3>
            </div>
            <nav className="p-2 space-y-1">
              <NavItem
                targetId="general"
                label="General Settings"
                icon={<Cog className="h-4 w-4" />}
                activeSection={activeSection}
                onClick={handleNavClick}
              />
              <NavItem
                targetId="models"
                label="AI Models"
                icon={<Bot className="h-4 w-4" />}
                activeSection={activeSection}
                onClick={handleNavClick}
              />
              <NavItem
                targetId="servers"
                label="MCP Servers"
                icon={<Server className="h-4 w-4" />}
                activeSection={activeSection}
                onClick={handleNavClick}
              />
              <NavItem
                targetId="supabase"
                label="Supabase"
                icon={<Database className="h-4 w-4" />}
                activeSection={activeSection}
                onClick={handleNavClick}
              />
              <NavItem
                targetId="workflows"
                label="Workflow Settings"
                icon={<Workflow className="h-4 w-4" />}
                activeSection={activeSection}
                onClick={handleNavClick}
              />
            </nav>
          </div>
        </aside>

        {/* Main content area - scrollable sections */}
        <main className="md:col-span-3 space-y-6">
          {/* General Settings Section */}
          <ConfigSection 
            id="general"
            title="General Settings" 
            description="Configure application-wide settings and defaults"
            icon={<Cog className="h-5 w-5" />}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <Label htmlFor="dark-mode" className="font-medium">Dark Mode</Label>
                        <p className="text-sm text-muted-foreground">Enable dark theme for the application</p>
                      </div>
                      <Switch id="dark-mode" defaultChecked />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <Label htmlFor="notifications" className="font-medium">Notifications</Label>
                        <p className="text-sm text-muted-foreground">Enable desktop notifications</p>
                      </div>
                      <Switch id="notifications" defaultChecked />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="app-name" className="font-medium">Application Name</Label>
                    <Input id="app-name" defaultValue="Nexus Platform" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="default-language" className="font-medium">Default Language</Label>
                    <select 
                      id="default-language" 
                      className="w-full p-2 rounded-md border border-input bg-background"
                      defaultValue="en"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ConfigSection>
          
          {/* AI Models Section */}
          <ConfigSection 
            id="models"
            title="AI Models" 
            description="Configure AI models and set API keys"
            icon={<Bot className="h-5 w-5" />}
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Configure your AI model API keys and default settings
                </p>
                <Button>
                  <Key className="mr-2 h-4 w-4" />
                  Add New Model
                </Button>
              </div>
              
              {/* Model configuration cards */}
              <div className="space-y-4">
                {models.map(model => (
                  <ModelConfigCard key={model.id} model={model} />
                ))}
              </div>
            </div>
          </ConfigSection>
          
          {/* MCP Servers Section */}
          <ConfigSection 
            id="servers"
            title="MCP Servers" 
            description="Configure MCP servers and available tools"
            icon={<Server className="h-5 w-5" />}
          >
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Configure your MCP servers and manage their tools
                </p>
                <Button>
                  <Server className="mr-2 h-4 w-4" />
                  Add New Server
                </Button>
              </div>
              
              {/* Server configuration cards */}
              <div className="space-y-4">
                {servers && servers.length > 0 ? (
                  servers.map(server => (
                    <ServerConfigWithTools 
                      key={server.id} 
                      server={server} 
                      getCapabilitiesByServer={getCapabilitiesByServer}
                    />
                  ))
                ) : (
                  <>
                    {/* Sample server if none exist */}
                    <ServerConfigWithTools 
                      server={{
                        id: "anthropic-server",
                        name: "Anthropic API",
                        description: "Claude AI models and tools",
                        url: "https://api.anthropic.com/v1",
                        status: "online"
                      }}
                      getCapabilitiesByServer={getCapabilitiesByServer || (() => [])}
                    />
                    <ServerConfigWithTools 
                      server={{
                        id: "supabase-server",
                        name: "Supabase API",
                        description: "Database and authentication services",
                        url: "https://yggwxqipshcuxraklvzb.supabase.co",
                        status: "online"
                      }}
                      getCapabilitiesByServer={getCapabilitiesByServer || (() => [])}
                    />
                  </>
                )}
              </div>
            </div>
          </ConfigSection>
          
          {/* Supabase Section */}
          <ConfigSection 
            id="supabase"
            title="Supabase" 
            description="Configure your Supabase database integration"
            icon={<Database className="h-5 w-5" />}
          >
            <SupabaseServerConfig />
          </ConfigSection>
          
          {/* Workflow Settings Section */}
          <ConfigSection 
            id="workflows"
            title="Workflow Settings" 
            description="Configure workflow execution settings"
            icon={<Workflow className="h-5 w-5" />}
          >
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <Label htmlFor="parallel-execution" className="font-medium">Parallel Execution</Label>
                        <p className="text-sm text-muted-foreground">Enable parallel execution of workflow nodes when possible</p>
                      </div>
                      <Switch id="parallel-execution" defaultChecked />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <Label htmlFor="auto-save" className="font-medium">Auto Save</Label>
                        <p className="text-sm text-muted-foreground">Automatically save workflow changes</p>
                      </div>
                      <Switch id="auto-save" defaultChecked />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="max-executions" className="font-medium">Max Concurrent Executions</Label>
                    <Input id="max-executions" type="number" defaultValue="5" min="1" max="20" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="timeout" className="font-medium">Default Timeout (seconds)</Label>
                    <Input id="timeout" type="number" defaultValue="60" min="10" max="300" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="default-system-prompt" className="font-medium">Default System Prompt</Label>
                    <Textarea 
                      id="default-system-prompt" 
                      rows={3}
                      defaultValue="You are a helpful AI assistant. Answer questions accurately and concisely."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </ConfigSection>
        </main>
      </div>
    </div>
  );
}

// Main Configuration Page (wrapper with MCPProvider)
export default function ConfigurationPage() {
  return (
    <MCPProvider>
      <ConfigContent />
    </MCPProvider>
  );
}