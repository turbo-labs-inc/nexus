/**
 * Types for the Workflow Orchestration system
 */

import { Node, Edge, NodeProps, EdgeProps } from "reactflow";

/**
 * Node types supported by the workflow system
 */
export enum NodeType {
  // Input/Output nodes
  INPUT = "input",
  OUTPUT = "output",

  // Processing nodes
  MCP_TOOL = "mcp-tool",
  PROMPT = "prompt",
  DATA_TRANSFORM = "data-transform",
  CONDITION = "condition",

  // Agent nodes
  FAST_AGENT = "fast-agent",

  // Utility nodes
  NOTE = "note",
  GROUP = "group",
}

/**
 * Edge types for connecting nodes
 */
export enum EdgeType {
  DEFAULT = "default",
  SUCCESS = "success",
  ERROR = "error",
  CONDITION = "condition",
}

/**
 * Status of a workflow or node
 */
export enum ExecutionStatus {
  IDLE = "idle",
  QUEUED = "queued",
  RUNNING = "running",
  SUCCEEDED = "succeeded",
  FAILED = "failed",
  CANCELLED = "cancelled",
  SKIPPED = "skipped",
}

/**
 * Base data for all node types
 */
export interface NodeData {
  label: string;
  description?: string;
  status?: ExecutionStatus;
  error?: string;
  executionTime?: number;
  icon?: string;
  color?: string;
  [key: string]: any;
}

/**
 * MCP Tool node data
 */
export interface MCPToolNodeData extends NodeData {
  toolId: string;
  toolName: string;
  serverId: string;
  serverName?: string;
  parameters: Record<string, any>;
  result?: any;
}

/**
 * Prompt node data
 */
export interface PromptNodeData extends NodeData {
  promptId: string;
  promptName: string;
  promptTemplate: string;
  variables: Record<string, string>;
  result?: string;
}

/**
 * Data transform node data
 */
export interface DataTransformNodeData extends NodeData {
  transformType: "map" | "filter" | "reduce" | "custom";
  transformFunction: string;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
  result?: any;
}

/**
 * Condition node data
 */
export interface ConditionNodeData extends NodeData {
  conditionType: "equals" | "contains" | "greater" | "less" | "custom";
  condition: string;
  leftValue?: string;
  rightValue?: string;
  result?: boolean;
}

/**
 * Fast-Agent node data
 */
export interface FastAgentNodeData extends NodeData {
  agentId: string;
  agentName: string;
  instruction: string;
  tools?: string[];
  message?: string;
  result?: string;
}

/**
 * Input node data
 */
export interface InputNodeData extends NodeData {
  variableType: "string" | "number" | "boolean" | "object" | "array";
  defaultValue?: any;
  required?: boolean;
  schema?: Record<string, any>;
  value?: any;
}

/**
 * Output node data
 */
export interface OutputNodeData extends NodeData {
  outputType: "result" | "log" | "error" | "data";
  value?: any;
}

/**
 * Note node data
 */
export interface NoteNodeData extends NodeData {
  content: string;
  fontSize?: number;
  width?: number;
  height?: number;
}

/**
 * Group node data
 */
export interface GroupNodeData extends NodeData {
  childNodeIds: string[];
  collapsed?: boolean;
  width?: number;
  height?: number;
}

/**
 * Type guard functions
 */
export const isMCPToolNodeData = (data: NodeData): data is MCPToolNodeData =>
  "toolId" in data && "serverId" in data;

export const isPromptNodeData = (data: NodeData): data is PromptNodeData =>
  "promptId" in data && "promptTemplate" in data;

export const isDataTransformNodeData = (data: NodeData): data is DataTransformNodeData =>
  "transformType" in data && "transformFunction" in data;

export const isConditionNodeData = (data: NodeData): data is ConditionNodeData =>
  "conditionType" in data && "condition" in data;

export const isFastAgentNodeData = (data: NodeData): data is FastAgentNodeData =>
  "agentId" in data && "instruction" in data;

export const isInputNodeData = (data: NodeData): data is InputNodeData => "variableType" in data;

export const isOutputNodeData = (data: NodeData): data is OutputNodeData => "outputType" in data;

export const isNoteNodeData = (data: NodeData): data is NoteNodeData => "content" in data;

export const isGroupNodeData = (data: NodeData): data is GroupNodeData => "childNodeIds" in data;

/**
 * Workflow definition
 */
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
  status: ExecutionStatus;
  nodes: Node<NodeData>[];
  edges: Edge[];
  tags?: string[];
  isTemplate?: boolean;
  executionCount?: number;
  lastExecutionTime?: string;
  lastExecutionStatus?: ExecutionStatus;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  metadata?: Record<string, any>;
}
