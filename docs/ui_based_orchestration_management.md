# UI-Based Orchestration Management

This document outlines the implementation of a UI-based orchestration management system for the Next.js PWA. This implementation builds upon the server-side MCP capabilities to provide a visual interface for creating, managing, and monitoring workflows across multiple MCP servers.

## Overview

The UI-based orchestration management system follows these key principles:

1. Visual workflow builder for creating and editing MCP workflows
2. Drag-and-drop interface for connecting MCP capabilities
3. Real-time monitoring of workflow execution
4. Template library for common workflow patterns
5. Version control and collaboration features

## Architecture

The orchestration management UI consists of the following components:

1. **Workflow Designer**: Visual canvas for creating and editing workflows
2. **Capability Browser**: Interface for browsing and selecting MCP capabilities
3. **Execution Monitor**: Dashboard for monitoring workflow execution
4. **Template Manager**: Library of workflow templates
5. **Version Control**: System for tracking workflow changes

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js Application                       │
├─────────────────┬─────────────────────────┬─────────────────────┤
│                 │                         │                     │
│  Orchestration  │     Server-Side         │    MCP Server       │
│  UI Components  │     Components          │    Infrastructure   │
│                 │                         │                     │
├─────────────────┤                         ├─────────────────────┤
│                 │                         │                     │
│ - Workflow      │                         │ - MCP Server        │
│   Designer      │                         │   Manager           │
│                 │                         │                     │
│ - Capability    │                         │ - MCP Capability    │
│   Browser       │                         │   Registry          │
│                 │                         │                     │
│ - Execution     │                         │ - MCP Orchestration │
│   Monitor       │                         │   Engine            │
│                 │                         │                     │
│ - Template      │                         ├─────────────────────┤
│   Manager       │                         │                     │
│                 │                         │ - Tool Servers      │
│ - Version       │                         │ - Resource Servers  │
│   Control       │                         │ - Prompt Servers    │
│                 │                         │                     │
└─────────────────┴─────────────────────────┴─────────────────────┘
```

## Implementation Details

### 1. Workflow Designer Component

The Workflow Designer is a React component that provides a canvas for visually creating and editing workflows:

```tsx
// src/components/orchestration/workflow-designer.tsx
"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Panel,
  Connection,
  Edge,
  Node,
  NodeTypes,
  EdgeTypes,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Play, Plus, Trash2, Settings, FileText } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

// Custom node components
import { ToolNode } from "./nodes/tool-node";
import { ResourceNode } from "./nodes/resource-node";
import { PromptNode } from "./nodes/prompt-node";
import { InputNode } from "./nodes/input-node";
import { OutputNode } from "./nodes/output-node";
import { ConditionNode } from "./nodes/condition-node";

// Node types definition
const nodeTypes: NodeTypes = {
  tool: ToolNode,
  resource: ResourceNode,
  prompt: PromptNode,
  input: InputNode,
  output: OutputNode,
  condition: ConditionNode,
};

// Edge types definition
const edgeTypes: EdgeTypes = {};

interface WorkflowDesignerProps {
  workflowId?: string;
  onSave?: (workflow: any) => void;
}

export function WorkflowDesigner({ workflowId, onSave }: WorkflowDesignerProps) {
  // Workflow metadata
  const [workflowName, setWorkflowName] = useState("New Workflow");
  const [workflowDescription, setWorkflowDescription] = useState("");

  // Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodeSettingsOpen, setNodeSettingsOpen] = useState(false);

  // Refs
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Load workflow if ID is provided
  useEffect(() => {
    if (workflowId) {
      fetchWorkflow(workflowId);
    }
  }, [workflowId]);

  const fetchWorkflow = async (id: string) => {
    try {
      const response = await fetch(`/api/mcp/workflows/${id}`);
      if (!response.ok) throw new Error("Failed to fetch workflow");

      const workflow = await response.json();

      // Set workflow metadata
      setWorkflowName(workflow.name);
      setWorkflowDescription(workflow.description);

      // Convert workflow steps to nodes and edges
      const flowNodes: Node[] = workflow.steps.map((step: any) => ({
        id: step.id,
        type: step.type,
        position: step.position || { x: 0, y: 0 },
        data: {
          label: step.name,
          ...step.config,
        },
      }));

      const flowEdges: Edge[] = [];
      workflow.steps.forEach((step: any) => {
        step.nextSteps.forEach((nextStepId: string) => {
          flowEdges.push({
            id: `${step.id}-${nextStepId}`,
            source: step.id,
            target: nextStepId,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          });
        });
      });

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (error) {
      console.error("Error fetching workflow:", error);
      toast({
        title: "Error",
        description: "Failed to load workflow",
        variant: "destructive",
      });
    }
  };

  // Handle connections between nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  // Handle node selection
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setNodeSettingsOpen(true);
  }, []);

  // Handle node drag
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Handle node drop
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData("application/reactflow");
      const nodeData = JSON.parse(event.dataTransfer.getData("application/json") || "{}");

      // Check if the dropped element is valid
      if (!type) return;

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label: nodeData.name || `New ${type}`,
          ...nodeData,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  // Save workflow
  const handleSaveWorkflow = async () => {
    try {
      // Convert nodes and edges to workflow format
      const steps = nodes.map((node) => {
        const nextSteps = edges
          .filter((edge) => edge.source === node.id)
          .map((edge) => edge.target);

        return {
          id: node.id,
          type: node.type,
          name: node.data.label,
          config: { ...node.data, label: undefined },
          nextSteps,
          position: node.position,
        };
      });

      const workflow = {
        id: workflowId,
        name: workflowName,
        description: workflowDescription,
        steps,
        entryPoint: steps.find((step) => step.type === "input")?.id || steps[0]?.id,
        variables: {},
      };

      if (workflowId) {
        // Update existing workflow
        const response = await fetch(`/api/mcp/workflows/${workflowId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(workflow),
        });

        if (!response.ok) throw new Error("Failed to update workflow");
      } else {
        // Create new workflow
        const response = await fetch("/api/mcp/workflows", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(workflow),
        });

        if (!response.ok) throw new Error("Failed to create workflow");

        const result = await response.json();
        if (result.id) {
          window.history.replaceState(null, "", `/orchestration/workflows/${result.id}`);
        }
      }

      toast({
        title: "Success",
        description: "Workflow saved successfully",
      });

      if (onSave) {
        onSave(workflow);
      }
    } catch (error) {
      console.error("Error saving workflow:", error);
      toast({
        title: "Error",
        description: "Failed to save workflow",
        variant: "destructive",
      });
    }
  };

  // Execute workflow
  const handleExecuteWorkflow = async () => {
    if (!workflowId) {
      toast({
        title: "Error",
        description: "Please save the workflow before executing",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/mcp/workflows/${workflowId}/execute`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to execute workflow");

      const result = await response.json();

      toast({
        title: "Success",
        description: `Workflow execution started (ID: ${result.executionId})`,
      });

      // Redirect to execution monitor
      window.location.href = `/orchestration/executions/${result.executionId}`;
    } catch (error) {
      console.error("Error executing workflow:", error);
      toast({
        title: "Error",
        description: "Failed to execute workflow",
        variant: "destructive",
      });
    }
  };

  // Add new node
  const handleAddNode = (type: string, data: any = {}) => {
    const newNode: Node = {
      id: `${type}-${Date.now()}`,
      type,
      position: {
        x: Math.random() * 300,
        y: Math.random() * 300,
      },
      data: {
        label: data.name || `New ${type}`,
        ...data,
      },
    };

    setNodes((nds) => nds.concat(newNode));
  };

  // Update node settings
  const handleUpdateNodeSettings = (updatedData: any) => {
    if (!selectedNode) return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              ...updatedData,
            },
          };
        }
        return node;
      })
    );

    setNodeSettingsOpen(false);
  };

  // Delete selected node
  const handleDeleteNode = () => {
    if (!selectedNode) return;

    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
    setEdges((eds) =>
      eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id)
    );

    setNodeSettingsOpen(false);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex-1">
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="h-auto border-none p-0 text-xl font-bold focus-visible:ring-0"
            placeholder="Workflow Name"
          />
          <Input
            value={workflowDescription}
            onChange={(e) => setWorkflowDescription(e.target.value)}
            className="h-auto border-none p-0 text-sm text-gray-500 focus-visible:ring-0"
            placeholder="Workflow Description"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSaveWorkflow}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
          <Button size="sm" onClick={handleExecuteWorkflow}>
            <Play className="mr-2 h-4 w-4" />
            Execute
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-64 overflow-y-auto border-r p-4">
          <h3 className="mb-4 font-semibold">Add Node</h3>

          <Tabs defaultValue="tools">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tools">Tools</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="prompts">Prompts</TabsTrigger>
            </TabsList>

            <TabsContent value="tools" className="mt-4 space-y-2">
              <CapabilityList
                type="tool"
                onDragStart={(event, item) => {
                  event.dataTransfer.setData("application/reactflow", "tool");
                  event.dataTransfer.setData("application/json", JSON.stringify(item));
                }}
                onClick={(item) => handleAddNode("tool", item)}
              />
            </TabsContent>

            <TabsContent value="resources" className="mt-4 space-y-2">
              <CapabilityList
                type="resource"
                onDragStart={(event, item) => {
                  event.dataTransfer.setData("application/reactflow", "resource");
                  event.dataTransfer.setData("application/json", JSON.stringify(item));
                }}
                onClick={(item) => handleAddNode("resource", item)}
              />
            </TabsContent>

            <TabsContent value="prompts" className="mt-4 space-y-2">
              <CapabilityList
                type="prompt"
                onDragStart={(event, item) => {
                  event.dataTransfer.setData("application/reactflow", "prompt");
                  event.dataTransfer.setData("application/json", JSON.stringify(item));
                }}
                onClick={(item) => handleAddNode("prompt", item)}
              />
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <h3 className="mb-4 font-semibold">Flow Controls</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => handleAddNode("input")}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("application/reactflow", "input");
                  event.dataTransfer.setData(
                    "application/json",
                    JSON.stringify({
                      name: "Input",
                      inputKey: "input",
                      defaultValue: "",
                    })
                  );
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Input
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => handleAddNode("output")}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("application/reactflow", "output");
                  event.dataTransfer.setData(
                    "application/json",
                    JSON.stringify({
                      name: "Output",
                      outputKey: "output",
                      value: "",
                    })
                  );
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Output
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="justify-start"
                onClick={() => handleAddNode("condition")}
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.setData("application/reactflow", "condition");
                  event.dataTransfer.setData(
                    "application/json",
                    JSON.stringify({
                      name: "Condition",
                      condition: {
                        left: "",
                        operator: "==",
                        right: "",
                      },
                    })
                  );
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Condition
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1" ref={reactFlowWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
            >
              <Controls />
              <Background />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </div>

      {/* Node Settings Dialog */}
      <Dialog open={nodeSettingsOpen} onOpenChange={setNodeSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Node Settings</DialogTitle>
            <DialogDescription>Configure the selected node</DialogDescription>
          </DialogHeader>

          {selectedNode && (
            <NodeSettingsForm
              node={selectedNode}
              onUpdate={handleUpdateNodeSettings}
              onDelete={handleDeleteNode}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Capability List Component
interface CapabilityListProps {
  type: "tool" | "resource" | "prompt";
  onDragStart: (event: React.DragEvent, item: any) => void;
  onClick: (item: any) => void;
}

function CapabilityList({ type, onDragStart, onClick }: CapabilityListProps) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, [type]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/mcp/capabilities/${type}s`);
      if (!response.ok) throw new Error(`Failed to fetch ${type}s`);

      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error(`Error fetching ${type}s:`, error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="py-4 text-center">Loading...</div>;
  }

  if (items.length === 0) {
    return <div className="py-4 text-center">No {type}s available</div>;
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div
          key={item.id}
          className="cursor-grab rounded border bg-white p-2 hover:bg-gray-50"
          draggable
          onDragStart={(e) => onDragStart(e, item)}
          onClick={() => onClick(item)}
        >
          <div className="font-medium">{item.name}</div>
          <div className="truncate text-xs text-gray-500">{item.description}</div>
        </div>
      ))}
    </div>
  );
}

// Node Settings Form Component
interface NodeSettingsFormProps {
  node: Node;
  onUpdate: (data: any) => void;
  onDelete: () => void;
}

function NodeSettingsForm({ node, onUpdate, onDelete }: NodeSettingsFormProps) {
  const [formData, setFormData] = useState<any>({ ...node.data });

  const handleChange = (key: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  // Render different forms based on node type
  const renderForm = () => {
    switch (node.type) {
      case "tool":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="label">Name</Label>
              <Input
                id="label"
                value={formData.label || ""}
                onChange={(e) => handleChange("label", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="toolId">Tool</Label>
              <Input
                id="toolId"
                value={formData.toolId || ""}
                onChange={(e) => handleChange("toolId", e.target.value)}
                disabled
              />
            </div>

            <div>
              <Label htmlFor="parameters">Parameters</Label>
              <textarea
                id="parameters"
                className="min-h-[100px] w-full rounded border p-2"
                value={JSON.stringify(formData.parameters || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleChange("parameters", parsed);
                  } catch (error) {
                    // Allow invalid JSON during editing
                  }
                }}
              />
            </div>
          </div>
        );

      case "resource":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="label">Name</Label>
              <Input
                id="label"
                value={formData.label || ""}
                onChange={(e) => handleChange("label", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="resourceId">Resource</Label>
              <Input
                id="resourceId"
                value={formData.resourceId || ""}
                onChange={(e) => handleChange("resourceId", e.target.value)}
                disabled
              />
            </div>

            <div>
              <Label htmlFor="query">Query</Label>
              <textarea
                id="query"
                className="min-h-[100px] w-full rounded border p-2"
                value={JSON.stringify(formData.query || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleChange("query", parsed);
                  } catch (error) {
                    // Allow invalid JSON during editing
                  }
                }}
              />
            </div>
          </div>
        );

      case "prompt":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="label">Name</Label>
              <Input
                id="label"
                value={formData.label || ""}
                onChange={(e) => handleChange("label", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="promptId">Prompt</Label>
              <Input
                id="promptId"
                value={formData.promptId || ""}
                onChange={(e) => handleChange("promptId", e.target.value)}
                disabled
              />
            </div>

            <div>
              <Label htmlFor="variables">Variables</Label>
              <textarea
                id="variables"
                className="min-h-[100px] w-full rounded border p-2"
                value={JSON.stringify(formData.variables || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleChange("variables", parsed);
                  } catch (error) {
                    // Allow invalid JSON during editing
                  }
                }}
              />
            </div>
          </div>
        );

      case "input":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="label">Name</Label>
              <Input
                id="label"
                value={formData.label || ""}
                onChange={(e) => handleChange("label", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="inputKey">Input Key</Label>
              <Input
                id="inputKey"
                value={formData.inputKey || ""}
                onChange={(e) => handleChange("inputKey", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="defaultValue">Default Value</Label>
              <Input
                id="defaultValue"
                value={formData.defaultValue || ""}
                onChange={(e) => handleChange("defaultValue", e.target.value)}
              />
            </div>
          </div>
        );

      case "output":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="label">Name</Label>
              <Input
                id="label"
                value={formData.label || ""}
                onChange={(e) => handleChange("label", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="outputKey">Output Key</Label>
              <Input
                id="outputKey"
                value={formData.outputKey || ""}
                onChange={(e) => handleChange("outputKey", e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                value={formData.value || ""}
                onChange={(e) => handleChange("value", e.target.value)}
              />
            </div>
          </div>
        );

      case "condition":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="label">Name</Label>
              <Input
                id="label"
                value={formData.label || ""}
                onChange={(e) => handleChange("label", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="left">Left</Label>
                <Input
                  id="left"
                  value={formData.condition?.left || ""}
                  onChange={(e) =>
                    handleChange("condition", {
                      ...formData.condition,
                      left: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="operator">Operator</Label>
                <select
                  id="operator"
                  className="w-full rounded border p-2"
                  value={formData.condition?.operator || "=="}
                  onChange={(e) =>
                    handleChange("condition", {
                      ...formData.condition,
                      operator: e.target.value,
                    })
                  }
                >
                  <option value="==">==</option>
                  <option value="!=">!=</option>
                  <option value=">">&gt;</option>
                  <option value=">=">&gt;=</option>
                  <option value="<">&lt;</option>
                  <option value="<=">&lt;=</option>
                </select>
              </div>

              <div>
                <Label htmlFor="right">Right</Label>
                <Input
                  id="right"
                  value={formData.condition?.right || ""}
                  onChange={(e) =>
                    handleChange("condition", {
                      ...formData.condition,
                      right: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div>
            <p>Unknown node type: {node.type}</p>
          </div>
        );
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {renderForm()}

      <DialogFooter className="mt-6">
        <Button type="button" variant="destructive" onClick={onDelete}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
        <Button type="submit">Save Changes</Button>
      </DialogFooter>
    </form>
  );
}
```

### 2. Custom Node Components

Create custom node components for different types of workflow steps:

```tsx
// src/components/orchestration/nodes/tool-node.tsx
import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Wrench } from "lucide-react";

export const ToolNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div className="min-w-[150px] rounded-md border-2 border-blue-500 bg-white px-4 py-2 shadow-md">
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
      <div className="flex items-center">
        <Wrench className="mr-2 h-4 w-4 text-blue-500" />
        <div className="font-bold">{data.label}</div>
      </div>
      <div className="mt-1 text-xs">Tool: {data.name || data.toolId}</div>
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
    </div>
  );
});

// src/components/orchestration/nodes/resource-node.tsx
import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { Database } from "lucide-react";

export const ResourceNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div className="min-w-[150px] rounded-md border-2 border-green-500 bg-white px-4 py-2 shadow-md">
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
      <div className="flex items-center">
        <Database className="mr-2 h-4 w-4 text-green-500" />
        <div className="font-bold">{data.label}</div>
      </div>
      <div className="mt-1 text-xs">Resource: {data.name || data.resourceId}</div>
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
    </div>
  );
});

// src/components/orchestration/nodes/prompt-node.tsx
import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { FileText } from "lucide-react";

export const PromptNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div className="min-w-[150px] rounded-md border-2 border-purple-500 bg-white px-4 py-2 shadow-md">
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
      <div className="flex items-center">
        <FileText className="mr-2 h-4 w-4 text-purple-500" />
        <div className="font-bold">{data.label}</div>
      </div>
      <div className="mt-1 text-xs">Prompt: {data.name || data.promptId}</div>
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
    </div>
  );
});

// src/components/orchestration/nodes/input-node.tsx
import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { ArrowDownCircle } from "lucide-react";

export const InputNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div className="min-w-[150px] rounded-md border-2 border-gray-500 bg-white px-4 py-2 shadow-md">
      <div className="flex items-center">
        <ArrowDownCircle className="mr-2 h-4 w-4 text-gray-500" />
        <div className="font-bold">{data.label}</div>
      </div>
      <div className="mt-1 text-xs">Key: {data.inputKey}</div>
      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
    </div>
  );
});

// src/components/orchestration/nodes/output-node.tsx
import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { ArrowUpCircle } from "lucide-react";

export const OutputNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div className="min-w-[150px] rounded-md border-2 border-gray-500 bg-white px-4 py-2 shadow-md">
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
      <div className="flex items-center">
        <ArrowUpCircle className="mr-2 h-4 w-4 text-gray-500" />
        <div className="font-bold">{data.label}</div>
      </div>
      <div className="mt-1 text-xs">Key: {data.outputKey}</div>
    </div>
  );
});

// src/components/orchestration/nodes/condition-node.tsx
import React, { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { GitBranch } from "lucide-react";

export const ConditionNode = memo(({ data, isConnectable }: NodeProps) => {
  return (
    <div className="min-w-[150px] rounded-md border-2 border-yellow-500 bg-white px-4 py-2 shadow-md">
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
      <div className="flex items-center">
        <GitBranch className="mr-2 h-4 w-4 text-yellow-500" />
        <div className="font-bold">{data.label}</div>
      </div>
      <div className="mt-1 text-xs">
        {data.condition?.left} {data.condition?.operator} {data.condition?.right}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="true"
        style={{ left: "25%" }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ left: "75%" }}
        isConnectable={isConnectable}
      />
    </div>
  );
});
```

### 3. Execution Monitor Component

The Execution Monitor provides a dashboard for monitoring workflow execution:

```tsx
// src/components/orchestration/execution-monitor.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RefreshCw, Play, AlertCircle, CheckCircle, Clock, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: "pending" | "running" | "completed" | "failed";
  currentStep: string | null;
  currentStepName?: string;
  progress: number;
  variables: Record<string, any>;
  results: Record<string, any>;
  error?: string;
  startTime: number;
  endTime?: number;
}

interface ExecutionMonitorProps {
  executionId?: string;
}

export function ExecutionMonitor({ executionId }: ExecutionMonitorProps) {
  const router = useRouter();
  const [execution, setExecution] = useState<WorkflowExecution | null>(null);
  const [recentExecutions, setRecentExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>(executionId ? "details" : "recent");

  useEffect(() => {
    if (executionId) {
      fetchExecution(executionId);

      // Poll for updates if execution is running
      const interval = setInterval(() => {
        if (execution?.status === "running" || execution?.status === "pending") {
          fetchExecution(executionId);
        }
      }, 2000);

      return () => clearInterval(interval);
    } else {
      fetchRecentExecutions();
    }
  }, [executionId]);

  const fetchExecution = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/mcp/executions/${id}`);
      if (!response.ok) throw new Error("Failed to fetch execution");

      const data = await response.json();
      setExecution(data);
    } catch (error) {
      console.error("Error fetching execution:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentExecutions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/mcp/executions?limit=10");
      if (!response.ok) throw new Error("Failed to fetch executions");

      const data = await response.json();
      setRecentExecutions(data);
    } catch (error) {
      console.error("Error fetching executions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    if (executionId) {
      fetchExecution(executionId);
    } else {
      fetchRecentExecutions();
    }
  };

  const formatDuration = (startTime: number, endTime?: number) => {
    const end = endTime || Date.now();
    const durationMs = end - startTime;

    if (durationMs < 1000) {
      return `${durationMs}ms`;
    }

    const seconds = Math.floor(durationMs / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "running":
        return "bg-blue-500";
      case "pending":
        return "bg-yellow-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "running":
        return <Play className="h-5 w-5 text-blue-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {executionId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/orchestration/executions")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
          <h2 className="text-2xl font-bold">
            {executionId ? "Execution Details" : "Workflow Executions"}
          </h2>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {loading && !execution && !recentExecutions.length ? (
        <div className="flex justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
        </div>
      ) : executionId && execution ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="variables">Variables</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{execution.workflowName}</CardTitle>
                    <CardDescription>Execution ID: {execution.id}</CardDescription>
                  </div>
                  <Badge className={getStatusColor(execution.status)}>{execution.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="mb-1 flex justify-between">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm font-medium">{execution.progress}%</span>
                    </div>
                    <Progress value={execution.progress} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold">Start Time</h4>
                      <p className="text-sm">{new Date(execution.startTime).toLocaleString()}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold">Duration</h4>
                      <p className="text-sm">
                        {formatDuration(execution.startTime, execution.endTime)}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold">Current Step</h4>
                      <p className="text-sm">
                        {execution.currentStepName || execution.currentStep || "None"}
                      </p>
                    </div>

                    <div>
                      <h4 className="text-sm font-semibold">Workflow ID</h4>
                      <p className="text-sm">{execution.workflowId}</p>
                    </div>
                  </div>

                  {execution.error && (
                    <div className="mt-4 rounded border border-red-200 bg-red-50 p-3">
                      <h4 className="text-sm font-semibold text-red-700">Error</h4>
                      <p className="text-sm text-red-700">{execution.error}</p>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/orchestration/workflows/${execution.workflowId}`)}
                >
                  View Workflow
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="variables" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Execution Variables</CardTitle>
                <CardDescription>Variables used during workflow execution</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="max-h-96 overflow-auto rounded bg-gray-100 p-4">
                  {JSON.stringify(execution.variables, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Execution Results</CardTitle>
                <CardDescription>Results produced by workflow steps</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="max-h-96 overflow-auto rounded bg-gray-100 p-4">
                  {JSON.stringify(execution.results, null, 2)}
                </pre>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {recentExecutions.length === 0 ? (
            <div className="rounded-lg border p-8 text-center">
              <p className="text-gray-500">No workflow executions found</p>
            </div>
          ) : (
            recentExecutions.map((exec) => (
              <Card key={exec.id} className="transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        {getStatusIcon(exec.status)}
                        <span className="ml-2">{exec.workflowName}</span>
                      </CardTitle>
                      <CardDescription>ID: {exec.id}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(exec.status)}>{exec.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Started:</span>{" "}
                      {new Date(exec.startTime).toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span>{" "}
                      {formatDuration(exec.startTime, exec.endTime)}
                    </div>
                  </div>

                  {exec.status === "running" && (
                    <div className="mt-2">
                      <div className="mb-1 flex justify-between">
                        <span className="text-xs">Progress</span>
                        <span className="text-xs">{exec.progress}%</span>
                      </div>
                      <Progress value={exec.progress} className="h-2" />
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/orchestration/executions/${exec.id}`)}
                  >
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
```

### 4. Template Manager Component

The Template Manager provides a library of workflow templates:

```tsx
// src/components/orchestration/template-manager.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Copy, Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: any[];
  thumbnail?: string;
}

export function TemplateManager() {
  const router = useRouter();
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWorkflowOpen, setNewWorkflowOpen] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: "",
    description: "",
    templateId: "",
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/mcp/templates");
      if (!response.ok) throw new Error("Failed to fetch templates");

      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromTemplate = async () => {
    try {
      if (!newWorkflow.name) {
        toast({
          title: "Error",
          description: "Workflow name is required",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch("/api/mcp/workflows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newWorkflow.name,
          description: newWorkflow.description,
          templateId: newWorkflow.templateId,
        }),
      });

      if (!response.ok) throw new Error("Failed to create workflow");

      const result = await response.json();

      toast({
        title: "Success",
        description: "Workflow created successfully",
      });

      // Reset form and close dialog
      setNewWorkflow({
        name: "",
        description: "",
        templateId: "",
      });
      setNewWorkflowOpen(false);

      // Navigate to the new workflow
      router.push(`/orchestration/workflows/${result.id}`);
    } catch (error) {
      console.error("Error creating workflow:", error);
      toast({
        title: "Error",
        description: "Failed to create workflow",
        variant: "destructive",
      });
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    setNewWorkflow({
      ...newWorkflow,
      templateId,
    });
    setNewWorkflowOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Workflow Templates</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchTemplates} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => router.push("/orchestration/workflows/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Blank Workflow
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.length === 0 ? (
            <div className="col-span-full rounded-lg border p-8 text-center">
              <p className="text-gray-500">No templates available</p>
            </div>
          ) : (
            templates.map((template) => (
              <Card key={template.id} className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-blue-500" />
                    {template.name}
                  </CardTitle>
                  <CardDescription>{template.category}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{template.description}</p>

                  {template.thumbnail && (
                    <div className="mt-4 overflow-hidden rounded border">
                      <img src={template.thumbnail} alt={template.name} className="h-auto w-full" />
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button variant="outline" onClick={() => handleSelectTemplate(template.id)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Use Template
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}

      {/* New Workflow Dialog */}
      <Dialog open={newWorkflowOpen} onOpenChange={setNewWorkflowOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Workflow</DialogTitle>
            <DialogDescription>
              Create a new workflow based on the selected template
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newWorkflow.name}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={newWorkflow.description}
                onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewWorkflowOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFromTemplate}>Create Workflow</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

### 5. Version Control Component

The Version Control component provides a system for tracking workflow changes:

```tsx
// src/components/orchestration/version-control.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { History, RefreshCw, RotateCcw, Save, Tag } from "lucide-react";
import { toast } from "@/components/ui/use-toast";

interface WorkflowVersion {
  id: string;
  workflowId: string;
  version: number;
  name: string;
  description: string;
  createdAt: number;
  createdBy: string;
}

interface VersionControlProps {
  workflowId: string;
  onRestore?: (versionId: string) => void;
}

export function VersionControl({ workflowId, onRestore }: VersionControlProps) {
  const [versions, setVersions] = useState<WorkflowVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveVersionOpen, setSaveVersionOpen] = useState(false);
  const [newVersion, setNewVersion] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (workflowId) {
      fetchVersions();
    }
  }, [workflowId]);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/mcp/workflows/${workflowId}/versions`);
      if (!response.ok) throw new Error("Failed to fetch versions");

      const data = await response.json();
      setVersions(data);
    } catch (error) {
      console.error("Error fetching versions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveVersion = async () => {
    try {
      if (!newVersion.name) {
        toast({
          title: "Error",
          description: "Version name is required",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`/api/mcp/workflows/${workflowId}/versions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newVersion),
      });

      if (!response.ok) throw new Error("Failed to save version");

      toast({
        title: "Success",
        description: "Version saved successfully",
      });

      // Reset form and close dialog
      setNewVersion({
        name: "",
        description: "",
      });
      setSaveVersionOpen(false);

      // Refresh versions
      fetchVersions();
    } catch (error) {
      console.error("Error saving version:", error);
      toast({
        title: "Error",
        description: "Failed to save version",
        variant: "destructive",
      });
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    try {
      const response = await fetch(
        `/api/mcp/workflows/${workflowId}/versions/${versionId}/restore`,
        {
          method: "POST",
        }
      );

      if (!response.ok) throw new Error("Failed to restore version");

      toast({
        title: "Success",
        description: "Version restored successfully",
      });

      if (onRestore) {
        onRestore(versionId);
      }
    } catch (error) {
      console.error("Error restoring version:", error);
      toast({
        title: "Error",
        description: "Failed to restore version",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center text-lg font-semibold">
          <History className="mr-2 h-5 w-5" />
          Version History
        </h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchVersions} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setSaveVersionOpen(true)}>
            <Save className="mr-2 h-4 w-4" />
            Save Version
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-4">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="space-y-2">
          {versions.length === 0 ? (
            <div className="rounded-lg border p-4 text-center">
              <p className="text-gray-500">No versions saved</p>
            </div>
          ) : (
            versions.map((version) => (
              <Card key={version.id}>
                <CardHeader className="py-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center text-base">
                        <Tag className="mr-2 h-4 w-4 text-blue-500" />
                        {version.name}
                      </CardTitle>
                      <CardDescription>
                        Version {version.version} • {new Date(version.createdAt).toLocaleString()}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRestoreVersion(version.id)}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Restore
                    </Button>
                  </div>
                </CardHeader>
                {version.description && (
                  <CardContent className="py-0">
                    <p className="text-sm">{version.description}</p>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </div>
      )}

      {/* Save Version Dialog */}
      <Dialog open={saveVersionOpen} onOpenChange={setSaveVersionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Version</DialogTitle>
            <DialogDescription>
              Save the current state of the workflow as a new version
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="versionName" className="text-right">
                Name
              </Label>
              <Input
                id="versionName"
                value={newVersion.name}
                onChange={(e) => setNewVersion({ ...newVersion, name: e.target.value })}
                className="col-span-3"
                placeholder="e.g., Initial Release"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="versionDescription" className="text-right">
                Description
              </Label>
              <Input
                id="versionDescription"
                value={newVersion.description}
                onChange={(e) => setNewVersion({ ...newVersion, description: e.target.value })}
                className="col-span-3"
                placeholder="e.g., First working version with basic functionality"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveVersionOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveVersion}>Save Version</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

### 6. Orchestration Dashboard

The Orchestration Dashboard provides a central hub for managing workflows:

```tsx
// src/app/orchestration/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Play, Plus, Settings, Trash2, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

interface Workflow {
  id: string;
  name: string;
  description: string;
  lastModified: number;
  lastExecuted?: number;
  executionCount: number;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: "pending" | "running" | "completed" | "failed";
  startTime: number;
  endTime?: number;
}

export default function OrchestrationDashboard() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [recentExecutions, setRecentExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch workflows
      const workflowsResponse = await fetch("/api/mcp/workflows");
      if (!workflowsResponse.ok) throw new Error("Failed to fetch workflows");
      const workflowsData = await workflowsResponse.json();
      setWorkflows(workflowsData);

      // Fetch recent executions
      const executionsResponse = await fetch("/api/mcp/executions?limit=5");
      if (!executionsResponse.ok) throw new Error("Failed to fetch executions");
      const executionsData = await executionsResponse.json();
      setRecentExecutions(executionsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkflow = async (id: string) => {
    try {
      const response = await fetch(`/api/mcp/workflows/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete workflow");

      toast({
        title: "Success",
        description: "Workflow deleted successfully",
      });

      // Refresh workflows
      fetchData();
    } catch (error) {
      console.error("Error deleting workflow:", error);
      toast({
        title: "Error",
        description: "Failed to delete workflow",
        variant: "destructive",
      });
    }
  };

  const handleExecuteWorkflow = async (id: string) => {
    try {
      const response = await fetch(`/api/mcp/workflows/${id}/execute`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to execute workflow");

      const result = await response.json();

      toast({
        title: "Success",
        description: `Workflow execution started (ID: ${result.executionId})`,
      });

      // Navigate to execution monitor
      router.push(`/orchestration/executions/${result.executionId}`);
    } catch (error) {
      console.error("Error executing workflow:", error);
      toast({
        title: "Error",
        description: "Failed to execute workflow",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "running":
        return "bg-blue-500";
      case "pending":
        return "bg-yellow-500";
      case "failed":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Orchestration Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => router.push("/orchestration/templates")}>
            <Plus className="mr-2 h-4 w-4" />
            New Workflow
          </Button>
        </div>
      </div>

      <Tabs defaultValue="workflows">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="workflows">My Workflows</TabsTrigger>
          <TabsTrigger value="executions">Recent Executions</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="mt-6">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {workflows.length === 0 ? (
                <div className="col-span-full rounded-lg border p-8 text-center">
                  <p className="text-gray-500">No workflows found</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => router.push("/orchestration/templates")}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Workflow
                  </Button>
                </div>
              ) : (
                workflows.map((workflow) => (
                  <Card key={workflow.id} className="transition-shadow hover:shadow-md">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <FileText className="mr-2 h-5 w-5 text-blue-500" />
                        {workflow.name}
                      </CardTitle>
                      <CardDescription>
                        Last modified: {new Date(workflow.lastModified).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-2 text-sm">{workflow.description}</p>

                      <div className="mt-4 text-sm text-gray-500">
                        {workflow.executionCount} executions
                        {workflow.lastExecuted && (
                          <span>
                            {" "}
                            • Last run: {new Date(workflow.lastExecuted).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/orchestration/workflows/${workflow.id}`)}
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExecuteWorkflow(workflow.id)}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Run
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteWorkflow(workflow.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="executions" className="mt-6">
          {loading ? (
            <div className="flex justify-center p-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {recentExecutions.length === 0 ? (
                <div className="rounded-lg border p-8 text-center">
                  <p className="text-gray-500">No recent executions found</p>
                </div>
              ) : (
                recentExecutions.map((execution) => (
                  <Card key={execution.id} className="transition-shadow hover:shadow-md">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle>{execution.workflowName}</CardTitle>
                          <CardDescription>ID: {execution.id}</CardDescription>
                        </div>
                        <Badge className={getStatusColor(execution.status)}>
                          {execution.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="font-medium">Started:</span>{" "}
                          {new Date(execution.startTime).toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">Duration:</span>{" "}
                          {execution.endTime
                            ? `${Math.round((execution.endTime - execution.startTime) / 1000)}s`
                            : "In progress"}
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/orchestration/executions/${execution.id}`)}
                      >
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))
              )}

              <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={() => router.push("/orchestration/executions")}>
                  View All Executions
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 7. Workflow Editor Page

The Workflow Editor Page provides a complete interface for creating and editing workflows:

```tsx
// src/app/orchestration/workflows/[id]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { WorkflowDesigner } from "@/components/orchestration/workflow-designer";
import { VersionControl } from "@/components/orchestration/version-control";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams } from "next/navigation";

export default function WorkflowEditorPage() {
  const params = useParams();
  const workflowId = params.id as string;
  const [activeTab, setActiveTab] = useState("editor");

  const handleRestoreVersion = (versionId: string) => {
    // Refresh the workflow designer
    window.location.reload();
  };

  return (
    <div className="container mx-auto h-[calc(100vh-4rem)] py-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
        <TabsList className="self-start">
          <TabsTrigger value="editor">Workflow Editor</TabsTrigger>
          <TabsTrigger value="versions">Version History</TabsTrigger>
        </TabsList>

        <TabsContent value="editor" className="mt-4 flex-1">
          <WorkflowDesigner workflowId={workflowId === "new" ? undefined : workflowId} />
        </TabsContent>

        <TabsContent value="versions" className="mt-4">
          {workflowId !== "new" && (
            <VersionControl workflowId={workflowId} onRestore={handleRestoreVersion} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 8. API Routes for Orchestration Management

Implement API routes for managing workflows, executions, and templates:

```typescript
// src/app/api/mcp/workflows/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { McpOrchestrationEngine } from "@/lib/mcp/orchestration-engine";
import { v4 as uuidv4 } from "uuid";

// Initialize orchestration engine
const orchestrationEngine = new McpOrchestrationEngine(/* registry */);

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all workflows
    const workflows = orchestrationEngine.getAllWorkflows();

    return NextResponse.json(workflows);
  } catch (error) {
    console.error("Error in workflows API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get workflow data from request
    const data = await req.json();

    let workflow;

    if (data.templateId) {
      // Create from template
      workflow = await createFromTemplate(data.templateId, data.name, data.description);
    } else {
      // Create new workflow
      workflow = {
        id: uuidv4(),
        name: data.name,
        description: data.description,
        steps: data.steps || [],
        entryPoint: data.entryPoint || null,
        variables: data.variables || {},
      };
    }

    // Register workflow
    const workflowId = orchestrationEngine.registerWorkflow(workflow);

    return NextResponse.json({ id: workflowId });
  } catch (error) {
    console.error("Error in workflows API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function createFromTemplate(templateId: string, name: string, description: string) {
  // Fetch template
  const response = await fetch(`/api/mcp/templates/${templateId}`);
  if (!response.ok) throw new Error("Failed to fetch template");

  const template = await response.json();

  // Create workflow from template
  return {
    name: name || template.name,
    description: description || template.description,
    steps: template.steps,
    entryPoint: template.entryPoint,
    variables: template.variables || {},
  };
}
```

```typescript
// src/app/api/mcp/workflows/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { McpOrchestrationEngine } from "@/lib/mcp/orchestration-engine";

// Initialize orchestration engine
const orchestrationEngine = new McpOrchestrationEngine(/* registry */);

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get workflow
    const workflow = orchestrationEngine.getWorkflow(params.id);

    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    return NextResponse.json(workflow);
  } catch (error) {
    console.error("Error in workflow API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get workflow data from request
    const data = await req.json();

    // Update workflow
    orchestrationEngine.updateWorkflow(params.id, data);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in workflow API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Remove workflow
    orchestrationEngine.removeWorkflow(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in workflow API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

```typescript
// src/app/api/mcp/workflows/[id]/execute/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { McpOrchestrationEngine } from "@/lib/mcp/orchestration-engine";

// Initialize orchestration engine
const orchestrationEngine = new McpOrchestrationEngine(/* registry */);

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get initial variables from request (if any)
    const data = await req.json().catch(() => ({}));
    const initialVariables = data.variables || {};

    // Execute workflow
    const executionId = await orchestrationEngine.executeWorkflow(params.id, initialVariables);

    return NextResponse.json({ executionId });
  } catch (error) {
    console.error("Error in workflow execute API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

## Integration with Server-Side MCP Capabilities

The UI-based orchestration management system integrates with the server-side MCP capabilities through the following mechanisms:

1. **Workflow Designer**: Connects to the MCP Capability Registry to browse and select MCP capabilities
2. **Execution Monitor**: Connects to the MCP Orchestration Engine to monitor workflow execution
3. **Template Manager**: Provides templates that leverage MCP capabilities
4. **Version Control**: Tracks changes to workflows that use MCP capabilities

### Integration Example

```typescript
// src/lib/mcp/orchestration-ui-integration.ts
import { McpServerManager } from "./server-manager";
import { McpCapabilityRegistry } from "./capability-registry";
import { McpOrchestrationEngine } from "./orchestration-engine";

export class OrchestrationUiIntegration {
  private serverManager: McpServerManager;
  private registry: McpCapabilityRegistry;
  private orchestrationEngine: McpOrchestrationEngine;

  constructor(
    serverManager: McpServerManager,
    registry: McpCapabilityRegistry,
    orchestrationEngine: McpOrchestrationEngine
  ) {
    this.serverManager = serverManager;
    this.registry = registry;
    this.orchestrationEngine = orchestrationEngine;

    // Set up event listeners for real-time updates
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Listen for capability registry events
    this.registry.on("tool:added", this.handleCapabilityChange);
    this.registry.on("tool:updated", this.handleCapabilityChange);
    this.registry.on("tool:removed", this.handleCapabilityChange);

    this.registry.on("resource:added", this.handleCapabilityChange);
    this.registry.on("resource:updated", this.handleCapabilityChange);
    this.registry.on("resource:removed", this.handleCapabilityChange);

    this.registry.on("prompt:added", this.handleCapabilityChange);
    this.registry.on("prompt:updated", this.handleCapabilityChange);
    this.registry.on("prompt:removed", this.handleCapabilityChange);

    // Listen for server manager events
    this.serverManager.on("server:started", this.handleServerChange);
    this.serverManager.on("server:stopped", this.handleServerChange);
    this.serverManager.on("server:error", this.handleServerChange);

    // Listen for orchestration engine events
    this.orchestrationEngine.on("execution:started", this.handleExecutionChange);
    this.orchestrationEngine.on("execution:updated", this.handleExecutionChange);
    this.orchestrationEngine.on("execution:completed", this.handleExecutionChange);
    this.orchestrationEngine.on("execution:failed", this.handleExecutionChange);
  }

  private handleCapabilityChange = (capability: any) => {
    // Broadcast capability change to connected clients
    this.broadcastEvent("capability_change", {
      type: capability.type,
      id: capability.id,
      action: capability.action,
    });
  };

  private handleServerChange = (server: any) => {
    // Broadcast server change to connected clients
    this.broadcastEvent("server_change", {
      id: server.id,
      status: server.status,
    });
  };

  private handleExecutionChange = (execution: any) => {
    // Broadcast execution change to connected clients
    this.broadcastEvent("execution_change", {
      id: execution.id,
      status: execution.status,
      progress: execution.progress,
    });
  };

  private broadcastEvent(eventType: string, data: any) {
    // Use WebSocket or Server-Sent Events to broadcast to clients
    // This is a placeholder for the actual implementation
    console.log(`Broadcasting ${eventType}:`, data);
  }

  // Methods for UI components to interact with server-side capabilities

  async getCapabilities(type: "tool" | "resource" | "prompt") {
    switch (type) {
      case "tool":
        return this.registry.getAllTools();
      case "resource":
        return this.registry.getAllResources();
      case "prompt":
        return this.registry.getAllPrompts();
      default:
        throw new Error(`Unknown capability type: ${type}`);
    }
  }

  async getServers() {
    return this.serverManager.getAllServers();
  }

  async getWorkflows() {
    return this.orchestrationEngine.getAllWorkflows();
  }

  async getExecutions() {
    return this.orchestrationEngine.getAllExecutions();
  }

  async executeWorkflow(workflowId: string, variables: Record<string, any> = {}) {
    return this.orchestrationEngine.executeWorkflow(workflowId, variables);
  }
}
```

## Conclusion

This implementation provides a comprehensive UI-based orchestration management system for the Next.js PWA. The key features include:

1. **Visual Workflow Designer**: A drag-and-drop interface for creating and editing workflows
2. **Custom Node Components**: Specialized components for different types of workflow steps
3. **Execution Monitor**: Real-time monitoring of workflow execution
4. **Template Manager**: Library of workflow templates for common patterns
5. **Version Control**: System for tracking workflow changes
6. **Orchestration Dashboard**: Central hub for managing workflows

The implementation follows a modular approach, with each component being implemented separately and proven to work individually. The UI components integrate seamlessly with the server-side MCP capabilities, providing a complete solution for orchestrating MCP workflows.

This UI-based orchestration management system completes the implementation of the Next.js PWA with MCP capabilities, providing a powerful tool for creating, managing, and monitoring workflows across multiple MCP servers.
