/**
 * MCP (Model Context Protocol) Types
 *
 * This file contains the core types for the MCP system, including server configurations,
 * capabilities, tools, resources, and prompts.
 */

// Export all specialized types
export * from './capability';
export * from './model';
export * from './slack';
export * from './component';

/**
 * MCP Server Configuration
 */
export interface MCPServerConfig {
  id: string;
  name: string;
  url: string;
  apiKey?: string;
  description?: string;
  capabilities: MCPCapability[];
  isActive: boolean;
  status: "online" | "offline" | "error" | "unknown";
  lastConnected?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * MCP Capability
 * Represents a specific capability that an MCP server provides
 */
export interface MCPCapability {
  id: string;
  type: "tool" | "resource" | "prompt" | "model" | "component" | "slack";
  name: string;
  description: string;
  version: string;
  schema: Record<string, any>;
  serverId: string;
  isActive: boolean;
  metadata?: Record<string, any>;
}

/**
 * MCP Tool
 * A specific type of capability that represents a tool that can be executed
 */
export interface MCPTool extends MCPCapability {
  type: "tool";
  functionName: string;
  parameters: MCPToolParameter[];
  returnSchema: Record<string, any>;
  isAsync: boolean;
  timeout?: number;
}

/**
 * MCP Tool Parameter
 */
export interface MCPToolParameter {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required: boolean;
  schema: Record<string, any>;
  defaultValue?: any;
}

/**
 * MCP Resource
 * A specific type of capability that represents a resource that can be queried
 */
export interface MCPResource extends MCPCapability {
  type: "resource";
  resourceType: string;
  querySchema: Record<string, any>;
  resultSchema: Record<string, any>;
}

/**
 * MCP Prompt
 * A specific type of capability that represents a prompt template that can be rendered
 */
export interface MCPPrompt extends MCPCapability {
  type: "prompt";
  template: string;
  variables: MCPPromptVariable[];
  defaultModel?: string;
  supportedModels?: string[];
}

/**
 * MCP Prompt Variable
 */
export interface MCPPromptVariable {
  name: string;
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  required: boolean;
  defaultValue?: any;
}

/**
 * MCP Server Status
 */
export interface MCPServerStatus {
  serverId: string;
  status: "online" | "offline" | "error" | "unknown";
  lastChecked: Date;
  errorMessage?: string;
  metrics?: {
    requestsPerMinute?: number;
    averageResponseTime?: number;
    errorRate?: number;
  };
}

/**
 * MCP Tool Execution Result
 */
export interface MCPToolExecutionResult<T = any> {
  success: boolean;
  result?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  executionTime?: number;
  logs?: string[];
}

/**
 * MCP Resource Query Result
 */
export interface MCPResourceQueryResult<T = any> {
  success: boolean;
  results?: T[];
  pagination?: {
    totalCount: number;
    pageSize: number;
    pageNumber: number;
    totalPages: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  executionTime?: number;
}

/**
 * MCP Prompt Rendering Result
 */
export interface MCPPromptRenderingResult {
  success: boolean;
  renderedPrompt?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  executionTime?: number;
}

/**
 * MCP Server Operation
 */
export type MCPServerOperation =
  | { type: "tool_execution"; toolId: string; parameters: Record<string, any> }
  | { type: "resource_query"; resourceId: string; query: Record<string, any> }
  | { type: "prompt_rendering"; promptId: string; variables: Record<string, any> }
  | { type: "model_execution"; modelId: string; request: import('./model').ModelExecutionRequest }
  | { type: "slack_message"; integrationId: string; request: import('./slack').SlackMessageRequest }
  | { type: "component_render"; componentId: string; props: Record<string, any> };

/**
 * MCP Server Connection Event
 */
export type MCPServerConnectionEvent =
  | { type: "connected"; serverId: string; timestamp: Date }
  | { type: "disconnected"; serverId: string; timestamp: Date; reason?: string }
  | { type: "error"; serverId: string; timestamp: Date; error: any }
  | {
      type: "status_change";
      serverId: string;
      timestamp: Date;
      status: "online" | "offline" | "error" | "unknown";
    }
  | {
      type: "capabilities_update";
      serverId: string;
      timestamp: Date;
      capabilities: MCPCapability[];
    }
  | {
      type: "tool_result";
      serverId: string;
      timestamp: Date;
      requestId: string;
      result: MCPToolExecutionResult;
    }
  | {
      type: "resource_result";
      serverId: string;
      timestamp: Date;
      requestId: string;
      result: MCPResourceQueryResult;
    }
  | {
      type: "prompt_result";
      serverId: string;
      timestamp: Date;
      requestId: string;
      result: MCPPromptRenderingResult;
    }
  | {
      type: "model_result";
      serverId: string;
      timestamp: Date;
      requestId: string;
      result: import('./model').ModelExecutionResult;
    }
  | {
      type: "model_stream_token";
      serverId: string;
      timestamp: Date;
      requestId: string;
      token: import('./model').ModelStreamToken;
    }
  | {
      type: "slack_message_result";
      serverId: string;
      timestamp: Date;
      requestId: string;
      result: import('./slack').SlackMessageResult;
    }
  | {
      type: "slack_incoming_message";
      serverId: string;
      timestamp: Date;
      message: import('./slack').SlackIncomingMessage;
    }
  | {
      type: "component_render_result";
      serverId: string;
      timestamp: Date;
      requestId: string;
      result: import('./component').ComponentRenderResult;
    };