"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  InputNodeConfig,
  OutputNodeConfig,
  NoteNodeConfig,
  ConditionNodeConfig,
  TransformNodeConfig,
} from "./node-config";
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  useReactFlow,
  BackgroundVariant,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { nodeTypes } from "./nodes";
import { NodeType, EdgeType, ExecutionStatus, NodeData, Workflow } from "@/lib/workflow/types";
import {
  Search,
  Plus,
  Save,
  Play,
  Trash2,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Copy,
  Wrench as Tool,
  Bot,
  MessageSquare,
  GitBranch,
  Sparkles,
  Clipboard,
  RefreshCw,
  ArrowRightLeft,
  StopCircle,
} from "lucide-react";

// Import workflow store and execution engine (will be implemented later)
// import { useWorkflowStore } from "@/lib/workflow/store";
// import { executeWorkflow } from "@/lib/workflow/execution";

interface WorkflowDesignerProps {
  workflow?: Workflow;
  onSave?: (workflow: Workflow) => void;
  readOnly?: boolean;
  showExecution?: boolean;
}

// Node data for palette
const nodeTemplates = [
  {
    type: NodeType.MCP_TOOL,
    label: "MCP Tool",
    description: "Execute an MCP tool on a server",
    icon: <Tool className="h-4 w-4" />,
    category: "processing",
    data: {
      toolId: "",
      toolName: "Select Tool",
      serverId: "",
      serverName: "Select Server",
      parameters: {},
    },
  },
  {
    type: NodeType.FAST_AGENT,
    label: "Fast-Agent",
    description: "Use a Fast-Agent with instructions",
    icon: <Bot className="h-4 w-4" />,
    category: "agents",
    data: {
      agentId: "",
      agentName: "Fast Agent",
      instruction: "Process the input and generate a response",
      tools: [],
    },
  },
  {
    type: NodeType.PROMPT,
    label: "Prompt",
    description: "Use a prompt template with variables",
    icon: <MessageSquare className="h-4 w-4" />,
    category: "processing",
    data: {
      promptId: "",
      promptName: "New Prompt",
      promptTemplate: "Write a response about {{topic}}",
      variables: { topic: "" },
    },
  },
  {
    type: NodeType.CONDITION,
    label: "Condition",
    description: "Branch workflow based on condition",
    icon: <GitBranch className="h-4 w-4" />,
    category: "flow",
    data: {
      conditionType: "equals",
      condition: "",
      leftValue: "",
      rightValue: "",
    },
  },
  {
    type: NodeType.DATA_TRANSFORM,
    label: "Transform",
    description: "Transform data between nodes",
    icon: <ArrowRightLeft className="h-4 w-4" />,
    category: "processing",
    data: {
      transformType: "map",
      transformFunction: "return input;",
    },
  },
  {
    type: NodeType.INPUT,
    label: "Input",
    description: "Define input parameters",
    icon: <Clipboard className="h-4 w-4" />,
    category: "io",
    data: {
      variableType: "string",
      defaultValue: "",
    },
  },
  {
    type: NodeType.OUTPUT,
    label: "Output",
    description: "Define workflow output",
    icon: <Sparkles className="h-4 w-4" />,
    category: "io",
    data: {
      outputType: "result",
    },
  },
];

// The inner component that contains the actual ReactFlow instance
function WorkflowDesignerInner({
  workflow,
  onSave,
  readOnly = false,
  showExecution = true,
}: WorkflowDesignerProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project } = useReactFlow();
  const [rfInstance, setRfInstance] = useState<any>(null);

  // Initialize with workflow data or empty arrays
  const [nodes, setNodes, onNodesChange] = useNodesState(workflow?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow?.edges || []);

  // Workflow execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // History for undo/redo
  const [history, setHistory] = useState<Array<{ nodes: Node[]; edges: Edge[] }>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Node configuration state
  const [configNodeId, setConfigNodeId] = useState<string | null>(null);
  const [configNodeType, setConfigNodeType] = useState<string | null>(null);
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false);

  // Update history when nodes or edges change
  useEffect(() => {
    if (isExecuting) return; // Don't record history during execution

    const newState = { nodes, edges };
    setHistory((prev) => {
      // If we're not at the end of history, truncate it
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, newState];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [nodes, edges, isExecuting]);

  // Listen for node:configure events
  useEffect(() => {
    const handleNodeConfigure = (event: CustomEvent<{ nodeId: string; nodeType: string }>) => {
      const { nodeId, nodeType } = event.detail;
      setConfigNodeId(nodeId);
      setConfigNodeType(nodeType);
      setIsConfigDialogOpen(true);
    };

    document.addEventListener("node:configure", handleNodeConfigure as EventListener);

    return () => {
      document.removeEventListener("node:configure", handleNodeConfigure as EventListener);
    };
  }, []);

  // Handle undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const item = history[newIndex];
      if (item && item.nodes && item.edges) {
        setNodes(item.nodes);
        setEdges(item.edges);
        setHistoryIndex(newIndex);
      }
    }
  }, [history, historyIndex, setNodes, setEdges]);

  // Handle redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const item = history[newIndex];
      if (item && item.nodes && item.edges) {
        setNodes(item.nodes);
        setEdges(item.edges);
        setHistoryIndex(newIndex);
      }
    }
  }, [history, historyIndex, setNodes, setEdges]);

  // Connection handling
  const onConnect = useCallback(
    (params: Connection) => {
      const sourceNode = nodes.find((node) => node.id === params.source);
      const targetNode = nodes.find((node) => node.id === params.target);

      // Prevent connections between certain node types if needed
      // if (sourceNode?.type === ... && targetNode?.type === ...) {
      //   return;
      // }

      // Create edge with type based on source or target node
      const edge = {
        id: `edge-${params.source}-${params.target}-${Date.now()}`,
        ...params,
        type: EdgeType.DEFAULT,
        animated: false,
        style: { stroke: "#64748b" },
      } as Edge;

      // Special edge styling for condition nodes
      if (sourceNode?.type === NodeType.CONDITION) {
        if (params.sourceHandle === "output-0") {
          edge.type = EdgeType.SUCCESS;
          edge.animated = true;
          edge.style = { stroke: "#22c55e" };
        } else if (params.sourceHandle === "output-1") {
          edge.type = EdgeType.ERROR;
          edge.animated = true;
          edge.style = { stroke: "#ef4444" };
        }
      }

      setEdges((eds) => addEdge(edge, eds));
    },
    [nodes, setEdges]
  );

  // Drag and drop handling for new nodes
  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (!reactFlowWrapper.current) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const nodeType = event.dataTransfer.getData("application/reactflow/type");
      const nodeData = JSON.parse(event.dataTransfer.getData("application/reactflow/data"));

      // Check if the dropped element is valid
      if (!nodeType || typeof nodeType !== "string") {
        return;
      }

      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `${nodeType}-${Date.now()}`,
        type: nodeType,
        position,
        data: {
          label: nodeData.label,
          description: nodeData.description,
          status: ExecutionStatus.IDLE,
          ...nodeData,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [project, setNodes]
  );

  // Track execution context to be able to cancel it
  const executionContextRef = useRef<any>(null);
  
  // Execution
  const handleExecuteWorkflow = useCallback(async () => {
    if (isExecuting) return;
    if (!workflow) return;

    try {
      setIsExecuting(true);

      // Reset status for all nodes
      const updatedNodes = nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          status: ExecutionStatus.QUEUED,
          error: undefined,
          result: undefined,
          executionTime: undefined,
        },
      }));
      
      setNodes(updatedNodes);
      
      // Import the execution engine dynamically
      // This avoids SSR issues since the engine uses browser APIs
      const { createWorkflowEngine } = await import("@/lib/workflow/execution");
      const engine = createWorkflowEngine();
      
      // Create updated workflow with reset nodes
      const workflowToExecute: Workflow = {
        ...workflow,
        nodes: updatedNodes,
      };
      
      // Execute the workflow
      const context = await engine.executeWorkflow(workflowToExecute);
      
      // Store the context for cancellation
      executionContextRef.current = context;
      
      // Update nodes with execution results
      const nodesWithResults = nodes.map(node => {
        const status = context.nodeStatuses[node.id] || ExecutionStatus.SKIPPED;
        const error = context.nodeErrors[node.id]?.message;
        const result = context.nodeResults[node.id];
        
        return {
          ...node,
          data: {
            ...node.data,
            status,
            error,
            result,
            executionTime: context.endTime && context.startTime 
              ? context.endTime.getTime() - context.startTime.getTime() 
              : undefined,
          },
        };
      });
      
      setNodes(nodesWithResults);
      
      // If we have a save callback, update the workflow with results
      if (onSave) {
        onSave({
          ...workflow,
          nodes: nodesWithResults,
          status: context.status,
          lastExecutionTime: context.endTime?.toISOString(),
          lastExecutionStatus: context.status,
        });
      }
    } catch (err) {
      console.error("Workflow execution error:", err);
    } finally {
      setIsExecuting(false);
    }
  }, [isExecuting, nodes, setNodes, workflow, onSave]);
  
  const handleStopExecution = useCallback(async () => {
    if (!isExecuting) return;
    
    try {
      // Import the execution engine dynamically
      if (executionContextRef.current) {
        const { WorkflowExecutionEngine } = await import("@/lib/workflow/execution");
        const engine = new WorkflowExecutionEngine();
        
        // Cancel the execution
        engine.cancelExecution(executionContextRef.current);
        
        // Update UI to show cancellation
        setNodes(nodes.map(node => {
          if (node.data.status === ExecutionStatus.RUNNING || node.data.status === ExecutionStatus.QUEUED) {
            return {
              ...node,
              data: {
                ...node.data,
                status: ExecutionStatus.CANCELLED,
              },
            };
          }
          return node;
        }));
      }
    } catch (err) {
      console.error("Error cancelling workflow execution:", err);
    } finally {
      setIsExecuting(false);
      executionContextRef.current = null;
    }
  }, [isExecuting, nodes, setNodes]);

  // Save workflow
  const handleSaveWorkflow = useCallback(() => {
    if (!rfInstance) return;

    const flowData = rfInstance.toObject();

    const workflowData: Workflow = {
      id: workflow?.id || `workflow-${Date.now()}`,
      name: workflow?.name || "New Workflow",
      description: workflow?.description || "",
      version: workflow?.version || "1.0.0",
      createdAt: workflow?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: workflow?.createdBy || "user",
      status: ExecutionStatus.IDLE,
      nodes: flowData.nodes,
      edges: flowData.edges,
    };

    onSave?.(workflowData);
  }, [rfInstance, workflow, onSave]);

  // Node Selection
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<NodeData>) => {
    setSelectedNodeId(node.id);
  }, []);

  // Delete selected node
  const handleDeleteNode = useCallback(() => {
    if (selectedNodeId) {
      setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
      // Also delete connected edges
      setEdges((eds) =>
        eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId)
      );
      setSelectedNodeId(null);
    }
  }, [selectedNodeId, setNodes, setEdges]);

  // Duplicate selected node
  const handleDuplicateNode = useCallback(() => {
    if (selectedNodeId) {
      const selectedNode = nodes.find((n) => n.id === selectedNodeId);
      if (selectedNode) {
        const newNode: Node = {
          ...selectedNode,
          id: `${selectedNode.type}-${Date.now()}`,
          position: {
            x: selectedNode.position.x + 50,
            y: selectedNode.position.y + 50,
          },
          selected: false,
        };
        setNodes((nds) => [...nds, newNode]);
      }
    }
  }, [selectedNodeId, nodes, setNodes]);

  // Handle node configuration updates
  const handleNodeConfigUpdate = useCallback(
    (updatedData: any) => {
      if (configNodeId) {
        setNodes((nds) =>
          nds.map((node) =>
            node.id === configNodeId
              ? {
                  ...node,
                  data: {
                    ...node.data,
                    ...updatedData,
                  },
                }
              : node
          )
        );

        // Close the dialog
        setIsConfigDialogOpen(false);
        setConfigNodeId(null);
        setConfigNodeType(null);
      }
    },
    [configNodeId, setNodes]
  );

  // Filter node templates based on search
  const filteredNodeTemplates = nodeTemplates.filter((template) => {
    if (!searchTerm) return true;

    const searchLower = searchTerm.toLowerCase();
    return (
      template.label.toLowerCase().includes(searchLower) ||
      (template.description?.toLowerCase() || "").includes(searchLower) ||
      template.category.toLowerCase().includes(searchLower)
    );
  });

  // Group templates by category
  const groupedTemplates: Record<string, any[]> = {};
  filteredNodeTemplates.forEach((template) => {
    if (!groupedTemplates[template.category]) {
      groupedTemplates[template.category] = [];
    }
    groupedTemplates[template.category].push(template);
  });

  // Get the configuration node data
  const getConfigNodeData = useCallback(() => {
    if (!configNodeId) return null;
    const node = nodes.find((n) => n.id === configNodeId);
    return node ? node.data : null;
  }, [configNodeId, nodes]);

  return (
    <div className="flex h-full w-full flex-col">
      {/* Node Configuration Dialogs */}
      {isConfigDialogOpen && configNodeId && configNodeType === "input" && (
        <InputNodeConfig
          isOpen={isConfigDialogOpen}
          onClose={() => setIsConfigDialogOpen(false)}
          onSave={handleNodeConfigUpdate}
          nodeData={getConfigNodeData() as any}
          nodeId={configNodeId}
        />
      )}

      {isConfigDialogOpen && configNodeId && configNodeType === "output" && (
        <OutputNodeConfig
          isOpen={isConfigDialogOpen}
          onClose={() => setIsConfigDialogOpen(false)}
          onSave={handleNodeConfigUpdate}
          nodeData={getConfigNodeData() as any}
          nodeId={configNodeId}
        />
      )}

      {isConfigDialogOpen && configNodeId && configNodeType === "note" && (
        <NoteNodeConfig
          isOpen={isConfigDialogOpen}
          onClose={() => setIsConfigDialogOpen(false)}
          onSave={handleNodeConfigUpdate}
          nodeData={getConfigNodeData() as any}
          nodeId={configNodeId}
        />
      )}

      {isConfigDialogOpen && configNodeId && configNodeType === "condition" && (
        <ConditionNodeConfig
          isOpen={isConfigDialogOpen}
          onClose={() => setIsConfigDialogOpen(false)}
          onSave={handleNodeConfigUpdate}
          nodeData={getConfigNodeData() as any}
          nodeId={configNodeId}
        />
      )}

      {isConfigDialogOpen && configNodeId && configNodeType === "transform" && (
        <TransformNodeConfig
          isOpen={isConfigDialogOpen}
          onClose={() => setIsConfigDialogOpen(false)}
          onSave={handleNodeConfigUpdate}
          nodeData={getConfigNodeData() as any}
          nodeId={configNodeId}
        />
      )}

      <div className="flex items-center justify-between border-b bg-background/80 px-4 py-2 backdrop-blur">
        {/* Left toolbar */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleUndo}
            disabled={historyIndex <= 0 || readOnly}
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRedo}
            disabled={historyIndex >= history.length - 1 || readOnly}
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </Button>

          {showExecution && (
            <>
              <div className="mx-1 h-6 w-px bg-border" />
              {isExecuting ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleStopExecution}
                  className="gap-1"
                  title="Stop Execution"
                >
                  <StopCircle className="h-4 w-4" />
                  <span>Stop</span>
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleExecuteWorkflow}
                  disabled={nodes.length === 0 || readOnly}
                  className="gap-1"
                  title="Execute Workflow"
                >
                  <Play className="h-4 w-4" />
                  <span>Execute</span>
                </Button>
              )}
            </>
          )}

          <div className="mx-1 h-6 w-px bg-border" />

          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveWorkflow}
            disabled={readOnly}
            className="gap-1"
            title="Save Workflow"
          >
            <Save className="h-4 w-4" />
            <span>Save</span>
          </Button>
        </div>

        {/* Center title */}
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{workflow?.name || "New Workflow"}</h2>
          {isExecuting && (
            <Badge
              variant="secondary"
              className="ml-2 animate-pulse bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
            >
              Executing...
            </Badge>
          )}
        </div>

        {/* Right toolbar */}
        <div className="flex items-center gap-2">
          {selectedNodeId && !readOnly && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDuplicateNode}
                title="Duplicate Node"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleDeleteNode} title="Delete Node">
                <Trash2 className="h-4 w-4" />
              </Button>
              <div className="mx-1 h-6 w-px bg-border" />
            </>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (rfInstance) {
                rfInstance.fitView({ padding: 0.2 });
              }
            }}
            title="Fit View"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Nodes Palette */}
        <div className="flex h-full w-64 flex-col border-r bg-background/80 backdrop-blur">
          <div className="border-b p-2">
            <div className="relative">
              <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search nodes..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Tabs defaultValue="all">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="processing">Process</TabsTrigger>
              <TabsTrigger value="agents">Agents</TabsTrigger>
              <TabsTrigger value="flow">Flow</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="flex-1">
              <ScrollArea className="h-[calc(100vh-11rem)]">
                <div className="space-y-4 p-2">
                  {Object.entries(groupedTemplates).map(([category, templates]) => (
                    <div key={category}>
                      <h3 className="mb-2 text-sm font-medium capitalize">{category}</h3>
                      <div className="space-y-2">
                        {templates.map((template, i) => (
                          <div
                            key={`${category}-${i}`}
                            className="cursor-grab rounded-md border bg-card p-2 shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                            draggable
                            onDragStart={(event) => {
                              event.dataTransfer.setData(
                                "application/reactflow/type",
                                template.type
                              );
                              event.dataTransfer.setData(
                                "application/reactflow/data",
                                JSON.stringify(template.data)
                              );
                              event.dataTransfer.effectAllowed = "move";
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary">
                                {template.icon}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{template.label}</span>
                                <span className="text-xs text-muted-foreground">
                                  {template.description}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="processing" className="flex-1">
              <ScrollArea className="h-[calc(100vh-11rem)]">
                <div className="space-y-2 p-2">
                  {groupedTemplates.processing &&
                    groupedTemplates.processing.map((template, i) => (
                      <div
                        key={`processing-${i}`}
                        className="cursor-grab rounded-md border bg-card p-2 shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData("application/reactflow/type", template.type);
                          event.dataTransfer.setData(
                            "application/reactflow/data",
                            JSON.stringify(template.data)
                          );
                          event.dataTransfer.effectAllowed = "move";
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary">
                            {template.icon}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{template.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {template.description}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="agents" className="flex-1">
              <ScrollArea className="h-[calc(100vh-11rem)]">
                <div className="space-y-2 p-2">
                  {groupedTemplates.agents &&
                    groupedTemplates.agents.map((template, i) => (
                      <div
                        key={`agents-${i}`}
                        className="cursor-grab rounded-md border bg-card p-2 shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData("application/reactflow/type", template.type);
                          event.dataTransfer.setData(
                            "application/reactflow/data",
                            JSON.stringify(template.data)
                          );
                          event.dataTransfer.effectAllowed = "move";
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary">
                            {template.icon}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{template.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {template.description}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="flow" className="flex-1">
              <ScrollArea className="h-[calc(100vh-11rem)]">
                <div className="space-y-2 p-2">
                  {groupedTemplates.flow &&
                    groupedTemplates.flow.map((template, i) => (
                      <div
                        key={`flow-${i}`}
                        className="cursor-grab rounded-md border bg-card p-2 shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData("application/reactflow/type", template.type);
                          event.dataTransfer.setData(
                            "application/reactflow/data",
                            JSON.stringify(template.data)
                          );
                          event.dataTransfer.effectAllowed = "move";
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary">
                            {template.icon}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{template.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {template.description}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* Workflow Canvas */}
        <div ref={reactFlowWrapper} className="h-full flex-1">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={(instance) => {
              if (instance) {
                setRfInstance(instance);
              }
            }}
            nodeTypes={nodeTypes}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            fitView
            deleteKeyCode={["Delete", "Backspace"]}
            proOptions={{ hideAttribution: true }}
            className="bg-background"
          >
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            <Controls />
            {/* <MiniMap /> */}
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}

// Wrapper component to provide ReactFlow context
export function WorkflowDesigner(props: WorkflowDesignerProps) {
  return (
    <ReactFlowProvider>
      <WorkflowDesignerInner {...props} />
    </ReactFlowProvider>
  );
}
