import { NodeType } from "@/lib/workflow/types";
import { NodeProps } from "reactflow";
import dynamic from "next/dynamic";

// Import node components
import { BaseNode } from "./base-node";
import { InputNode, OutputNode, NoteNode } from "./io-nodes";

// Dynamically import node components to reduce bundle size
const MCPToolNode = dynamic(() => import("./mcp-tool-node"));
const FastAgentNode = dynamic(() => import("./fast-agent-node"));
const ConditionNode = dynamic(() => import("./condition-node"));
const PromptNode = dynamic(() => import("./prompt-node"));
const TransformNode = dynamic(() => import("./transform-node"));

// Node registry
export const nodeTypes = {
  [NodeType.MCP_TOOL]: MCPToolNode,
  [NodeType.FAST_AGENT]: FastAgentNode,
  [NodeType.CONDITION]: ConditionNode,
  [NodeType.PROMPT]: PromptNode,
  [NodeType.DATA_TRANSFORM]: TransformNode,
  [NodeType.INPUT]: InputNode,
  [NodeType.OUTPUT]: OutputNode,
  [NodeType.NOTE]: NoteNode,
};

// Export all nodes
export {
  BaseNode,
  MCPToolNode,
  FastAgentNode,
  ConditionNode,
  PromptNode,
  TransformNode,
  InputNode,
  OutputNode,
  NoteNode,
};
