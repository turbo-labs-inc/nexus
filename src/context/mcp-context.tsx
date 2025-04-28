"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useMCPServerManager, getMCPServerManager } from "@/lib/mcp/server/manager";
import {
  MCPServerConfig,
  MCPServerStatus,
  MCPCapability,
  MCPToolExecutionResult,
  MCPResourceQueryResult,
  MCPPromptRenderingResult,
} from "@/lib/mcp/types";
import { logger, LogLevel, metrics, MetricType } from "@/lib/mcp/utils";
import { useSupabaseClient } from "@/lib/supabase/client";
import { Json } from "@/lib/supabase/database.types";
import { DatabaseError } from "@/components/ui/database-error";

interface MCPContextProps {
  servers: MCPServerConfig[];
  serverStatuses: MCPServerStatus[];
  capabilities: MCPCapability[];
  isLoading: boolean;
  error: string | null;
  registerServer: (config: MCPServerConfig) => void;
  unregisterServer: (serverId: string) => void;
  connectToServer: (serverId: string) => Promise<boolean>;
  disconnectFromServer: (serverId: string) => Promise<void>;
  executeTool: <T = any>(
    toolId: string,
    parameters: Record<string, any>
  ) => Promise<MCPToolExecutionResult<T>>;
  queryResource: <T = any>(
    resourceId: string,
    query: Record<string, any>
  ) => Promise<MCPResourceQueryResult<T>>;
  renderPrompt: (
    promptId: string,
    variables: Record<string, any>
  ) => Promise<MCPPromptRenderingResult>;
  getServer: (id: string) => MCPServerConfig | undefined;
  getServerStatus: (id: string) => MCPServerStatus | undefined;
  getCapabilitiesByServer: (id: string) => MCPCapability[];
  getCapabilitiesByType: (type: "tool" | "resource" | "prompt") => MCPCapability[];
}

const MCPContext = createContext<MCPContextProps | undefined>(undefined);

export function MCPProvider({ children }: { children: ReactNode }) {
  const {
    servers,
    serverStatuses,
    registerServer,
    unregisterServer,
    connectToServer,
    disconnectFromServer,
    executeTool,
    queryResource,
    renderPrompt,
    getServer,
    getServerStatus,
    getAllCapabilities,
    getCapabilitiesByServer,
    getCapabilitiesByType,
  } = useMCPServerManager();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [capabilities, setCapabilities] = useState<MCPCapability[]>([]);
  const supabase = useSupabaseClient();

  // Load saved server configurations from Supabase
useEffect(() => {
  const loadServers = async () => {
    setIsLoading(true);
    setError(null);

    logger.info("Loading MCP server configurations from Supabase", undefined, undefined, "mcp-context");
    
    try {
      // Track timing for loading servers
      const startTime = performance.now();
      
      if (!supabase) {
        logger.warn("Supabase client not available yet", undefined, undefined, "mcp-context");
        setError("Supabase client not available. Please try again later.");
        return;
      }
      
      // Fetch saved servers from Supabase
      const { data, error } = await supabase.from("mcp_configs").select("*");

      if (error) {
        logger.error("Supabase error fetching MCP configs", { error }, undefined, "mcp-context");
        
        // If we get a "relation does not exist" error, show a helpful error message
        if (error.message && error.message.includes("does not exist")) {
          setError(
            "Database tables don't exist. Please visit /admin/setup to initialize the database."
          );
          
          // Store a flag in sessionStorage but don't show an alert
          if (typeof window !== 'undefined' && !sessionStorage.getItem('db_setup_alert_shown')) {
            sessionStorage.setItem('db_setup_alert_shown', 'true');
          }
        } else {
          setError(error.message || "Unknown database error");
        }
        return;
      }
      
      logger.info(`Found ${data?.length || 0} MCP server configs in database`, undefined, undefined, "mcp-context");
      
      // Register each server
      if (data && data.length > 0) {
        data.forEach((config) => {
          try {
            // Extract the MCP server config from the database record
            const mcpConfig = config.config as unknown as MCPServerConfig;
            
            // Make sure it has an ID
            mcpConfig.id = mcpConfig.id || config.id;
            
            logger.debug(`Registering MCP server from database: ${mcpConfig.name}`, 
              { id: mcpConfig.id }, 
              mcpConfig.id,
              "mcp-context"
            );
            
            // Register the server
            registerServer(mcpConfig);
          } catch (configError) {
            logger.error(`Failed to register MCP config: ${config.name}`, 
              { error: configError }, 
              config.id,
              "mcp-context"
            );
          }
        });
      }

      // Update capabilities
      const capabilities = getAllCapabilities();
      setCapabilities(capabilities);
      
      // Log completion and record metrics
      const loadTime = performance.now() - startTime;
      logger.info(
        `Loaded ${data?.length || 0} MCP servers with ${capabilities.length} capabilities in ${loadTime.toFixed(2)}ms`,
        undefined,
        undefined,
        "mcp-context"
      );
      
      metrics.recordHistogram(
        MetricType.API_REQUEST_TIME,
        loadTime,
        undefined,
        { operation: "load_mcp_configs" }
      );
      
    } catch (err: any) {
      logger.error("Error loading MCP servers", { error: err }, undefined, "mcp-context");
      setError(`Error loading MCP servers: ${err.message}`);
      
      metrics.incrementCounter(
        MetricType.ERROR_COUNT,
        1,
        undefined,
        { operation: "load_mcp_configs" }
      );
    } finally {
      setIsLoading(false);
    }
  };

  loadServers();
}, [supabase, registerServer, getAllCapabilities]);

  // Update capabilities when servers change
  useEffect(() => {
    setCapabilities(getAllCapabilities());
  }, [servers, getAllCapabilities]);

  // Context value
  const value: MCPContextProps = {
    servers,
    serverStatuses,
    capabilities,
    isLoading,
    error,
    registerServer,
    unregisterServer,
    connectToServer,
    disconnectFromServer,
    executeTool,
    queryResource,
    renderPrompt,
    getServer,
    getServerStatus,
    getCapabilitiesByServer,
    getCapabilitiesByType,
  };

  // If there's a database error, show a dedicated UI component
  if (error && error.includes("Database tables don't exist")) {
    return (
      <MCPContext.Provider value={value}>
        <DatabaseError message={error} />
      </MCPContext.Provider>
    );
  }

  return <MCPContext.Provider value={value}>{children}</MCPContext.Provider>;
}

export function useMCP() {
  const context = useContext(MCPContext);

  if (context === undefined) {
    throw new Error("useMCP must be used within an MCPProvider");
  }

  return context;
}
