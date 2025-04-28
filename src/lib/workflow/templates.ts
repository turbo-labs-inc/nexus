import { v4 as uuidv4 } from "uuid";
import { Workflow, NodeType, ExecutionStatus } from "./types";

/**
 * Creates a new workflow template from a given workflow
 * @param workflow The workflow to create a template from
 * @param templateName Name of the template
 * @param templateDescription Description of the template
 * @returns The workflow template
 */
export function createTemplateFromWorkflow(
  workflow: Workflow,
  templateName?: string,
  templateDescription?: string
): Workflow {
  // Create a clean version of the workflow to use as a template
  const template: Workflow = {
    ...workflow,
    id: `template-${uuidv4()}`,
    name: templateName || `${workflow.name} Template`,
    description: templateDescription || `Template created from ${workflow.name}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isTemplate: true,
    // Reset execution-related properties
    status: ExecutionStatus.IDLE,
    lastExecutionTime: undefined,
    lastExecutionStatus: undefined,
    nodes: workflow.nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        status: ExecutionStatus.IDLE,
        error: undefined,
        result: undefined,
        executionTime: undefined,
      }
    })),
  };

  return template;
}

/**
 * Creates a new workflow from a template
 * @param template The template to create a workflow from
 * @param workflowName Optional name for the new workflow
 * @returns The new workflow
 */
export function createWorkflowFromTemplate(
  template: Workflow,
  workflowName?: string
): Workflow {
  return {
    ...template,
    id: `workflow-${uuidv4()}`,
    name: workflowName || `${template.name.replace(" Template", "")}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isTemplate: false,
  };
}

/**
 * Default templates for common workflow patterns
 */
export const defaultTemplates: Workflow[] = [
  // Data processing template
  {
    id: "template-data-processing",
    name: "Data Processing Workflow",
    description: "A template for processing and transforming data",
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "system",
    status: ExecutionStatus.IDLE,
    isTemplate: true,
    tags: ["processing", "data", "transform"],
    nodes: [
      {
        id: "input-data",
        type: NodeType.INPUT,
        position: { x: 100, y: 200 },
        data: {
          label: "Input Data",
          description: "Enter data to process",
          variableType: "object",
          defaultValue: "{}",
        },
      },
      {
        id: "transform-data",
        type: NodeType.DATA_TRANSFORM,
        position: { x: 400, y: 200 },
        data: {
          label: "Transform Data",
          description: "Transform the input data",
          transformType: "custom",
          transformFunction: "// Transform the input data\nreturn input;",
        },
      },
      {
        id: "condition-check",
        type: NodeType.CONDITION,
        position: { x: 700, y: 200 },
        data: {
          label: "Validate Result",
          description: "Check if result is valid",
          conditionType: "custom",
          condition: "return true; // Replace with your validation logic",
        },
      },
      {
        id: "output-success",
        type: NodeType.OUTPUT,
        position: { x: 1000, y: 100 },
        data: {
          label: "Valid Result",
          description: "Output for valid results",
          outputType: "result",
        },
      },
      {
        id: "output-error",
        type: NodeType.OUTPUT,
        position: { x: 1000, y: 300 },
        data: {
          label: "Invalid Result",
          description: "Output for invalid results",
          outputType: "error",
        },
      },
    ],
    edges: [
      {
        id: "edge-input-transform",
        source: "input-data",
        target: "transform-data",
        type: "default",
      },
      {
        id: "edge-transform-condition",
        source: "transform-data",
        target: "condition-check",
        type: "default",
      },
      {
        id: "edge-condition-success",
        source: "condition-check",
        target: "output-success",
        sourceHandle: "output-0",
        type: "success",
        animated: true,
        style: { stroke: "#22c55e" },
      },
      {
        id: "edge-condition-error",
        source: "condition-check",
        target: "output-error",
        sourceHandle: "output-1",
        type: "error",
        animated: true,
        style: { stroke: "#ef4444" },
      },
    ],
  },

  // Agent prompt template
  {
    id: "template-agent-prompt",
    name: "Agent with Prompt Workflow",
    description: "A template for using a Fast-Agent with prompt templates",
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "system",
    status: ExecutionStatus.IDLE,
    isTemplate: true,
    tags: ["agent", "prompt", "template"],
    nodes: [
      {
        id: "input-query",
        type: NodeType.INPUT,
        position: { x: 100, y: 200 },
        data: {
          label: "User Query",
          description: "The user's question or query",
          variableType: "string",
          defaultValue: "",
        },
      },
      {
        id: "prompt-template",
        type: NodeType.PROMPT,
        position: { x: 400, y: 200 },
        data: {
          label: "System Prompt",
          description: "Format the user query with a system prompt",
          promptId: "",
          promptName: "System Prompt",
          promptTemplate: "You are a helpful assistant. User query: {{userQuery}}",
          variables: { userQuery: "{{User Query}}" },
        },
      },
      {
        id: "agent-process",
        type: NodeType.FAST_AGENT,
        position: { x: 700, y: 200 },
        data: {
          label: "Process Query",
          description: "Process the query with Fast-Agent",
          agentId: "query-agent",
          agentName: "Query Agent",
          instruction: "{{System Prompt}}",
          tools: [],
        },
      },
      {
        id: "output-response",
        type: NodeType.OUTPUT,
        position: { x: 1000, y: 200 },
        data: {
          label: "Agent Response",
          description: "The agent's response to the query",
          outputType: "result",
        },
      },
    ],
    edges: [
      {
        id: "edge-input-prompt",
        source: "input-query",
        target: "prompt-template",
        type: "default",
      },
      {
        id: "edge-prompt-agent",
        source: "prompt-template",
        target: "agent-process",
        type: "default",
      },
      {
        id: "edge-agent-output",
        source: "agent-process",
        target: "output-response",
        type: "default",
      },
    ],
  },

  // MCP Tool Chain template
  {
    id: "template-mcp-chain",
    name: "MCP Tool Chain Workflow",
    description: "A template for chaining multiple MCP tools together",
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "system",
    status: ExecutionStatus.IDLE,
    isTemplate: true,
    tags: ["mcp", "tools", "chain"],
    nodes: [
      {
        id: "input-parameters",
        type: NodeType.INPUT,
        position: { x: 100, y: 200 },
        data: {
          label: "Input Parameters",
          description: "Parameters for the tool chain",
          variableType: "object",
          defaultValue: "{}",
        },
      },
      {
        id: "tool-first",
        type: NodeType.MCP_TOOL,
        position: { x: 400, y: 200 },
        data: {
          label: "First Tool",
          description: "First tool in the chain",
          toolId: "",
          toolName: "Select Tool",
          serverId: "",
          serverName: "Select Server",
          parameters: {},
        },
      },
      {
        id: "tool-second",
        type: NodeType.MCP_TOOL,
        position: { x: 700, y: 200 },
        data: {
          label: "Second Tool",
          description: "Second tool in the chain",
          toolId: "",
          toolName: "Select Tool",
          serverId: "",
          serverName: "Select Server",
          parameters: {},
        },
      },
      {
        id: "output-result",
        type: NodeType.OUTPUT,
        position: { x: 1000, y: 200 },
        data: {
          label: "Chain Result",
          description: "The result of the tool chain",
          outputType: "result",
        },
      },
    ],
    edges: [
      {
        id: "edge-input-first",
        source: "input-parameters",
        target: "tool-first",
        type: "default",
      },
      {
        id: "edge-first-second",
        source: "tool-first",
        target: "tool-second",
        type: "default",
      },
      {
        id: "edge-second-output",
        source: "tool-second",
        target: "output-result",
        type: "default",
      },
    ],
  },
];

/**
 * Gets template recommendations based on tags or categories
 * @param tags Tags to filter templates by
 * @returns Recommended templates
 */
export function getTemplateRecommendations(tags?: string[]): Workflow[] {
  if (!tags || tags.length === 0) {
    return defaultTemplates;
  }

  // Filter templates that match any of the provided tags
  return defaultTemplates.filter(template => 
    template.tags?.some(tag => tags.includes(tag))
  );
}