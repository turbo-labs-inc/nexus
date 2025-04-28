"use client";

import { useState, useEffect } from "react";
import { WorkflowDesigner } from "@/components/workflow/workflow-designer";
import { Workflow, ExecutionStatus, NodeType } from "@/lib/workflow/types";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, Save, Play, StopCircle } from "lucide-react";
import { toast } from "sonner";
import { useWorkflowStore, useWorkflow, useWorkflowExecution } from "@/lib/workflow";

export default function WorkflowDemoPage() {
  // Get workflows from the store
  const {
    workflows,
    createWorkflow,
    getCurrentWorkflow,
    setCurrentWorkflow,
    updateWorkflow
  } = useWorkflowStore();
  
  // Current workflow state
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  
  // Get current workflow data
  const { workflow } = useWorkflow(selectedWorkflowId || undefined);
  
  // Setup workflow execution
  const { 
    isExecuting, 
    executeWorkflow, 
    cancelExecution 
  } = useWorkflowExecution({
    onExecutionStart: () => {
      toast.info("Workflow execution started");
    },
    onExecutionComplete: (context) => {
      toast.success(`Workflow execution completed with status: ${context.status}`);
    },
    onExecutionError: (error) => {
      toast.error(`Workflow execution failed: ${error.message}`);
    }
  });

  // Demo/example workflow
  const exampleWorkflow: Workflow = {
    id: "example-workflow",
    name: "Example Workflow",
    description: "A simple workflow to demonstrate the designer",
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "demo-user",
    status: ExecutionStatus.IDLE,
    nodes: [
      {
        id: "input-1",
        type: NodeType.INPUT,
        position: { x: 100, y: 100 },
        data: {
          label: "User Input",
          description: "User query to process",
          variableType: "string",
          defaultValue: "example input value",
        },
      },
      {
        id: "transform-1",
        type: NodeType.DATA_TRANSFORM,
        position: { x: 400, y: 100 },
        data: {
          label: "Transform Data",
          description: "Process the input data",
          transformType: "custom",
          transformFunction: "return `Processed: ${input.toUpperCase()}`",
        },
      },
      {
        id: "condition-1",
        type: NodeType.CONDITION,
        position: { x: 700, y: 100 },
        data: {
          label: "Check Content",
          description: "Check if content contains keywords",
          conditionType: "contains",
          leftValue: "{{transform-1_result}}",
          rightValue: "PROCESS",
        },
      },
      {
        id: "output-success",
        type: NodeType.OUTPUT,
        position: { x: 1000, y: 50 },
        data: {
          label: "Success Output",
          description: "Output when condition is true",
          outputType: "result",
        },
      },
      {
        id: "output-failure",
        type: NodeType.OUTPUT,
        position: { x: 1000, y: 150 },
        data: {
          label: "Failure Output",
          description: "Output when condition is false",
          outputType: "error",
        },
      },
    ],
    edges: [
      {
        id: "edge-input-transform",
        source: "input-1",
        target: "transform-1",
        type: "default",
      },
      {
        id: "edge-transform-condition",
        source: "transform-1",
        target: "condition-1",
        type: "default",
      },
      {
        id: "edge-condition-success",
        source: "condition-1",
        target: "output-success",
        sourceHandle: "output-0",
        type: "success",
        animated: true,
        style: { stroke: "#22c55e" },
      },
      {
        id: "edge-condition-failure",
        source: "condition-1",
        target: "output-failure",
        sourceHandle: "output-1",
        type: "error",
        animated: true,
        style: { stroke: "#ef4444" },
      },
    ],
  };

  // Initialize the example workflow in the store if needed
  useEffect(() => {
    // Check if example workflow exists in store
    if (!workflows[exampleWorkflow.id]) {
      updateWorkflow(exampleWorkflow.id, exampleWorkflow);
    }
  }, [workflows, updateWorkflow]);

  const handleSaveWorkflow = (workflow: Workflow) => {
    // Update the workflow in the store
    updateWorkflow(workflow.id, workflow);
    
    // Update selected workflow
    setSelectedWorkflowId(workflow.id);
    
    // Show notification
    toast.success(`Workflow "${workflow.name}" saved successfully`);
  };
  
  const handleCreateNewWorkflow = () => {
    const id = createWorkflow("New Workflow", "A new workflow");
    setSelectedWorkflowId(id);
    toast.info("New workflow created");
  };
  
  const handleExecuteWorkflow = async () => {
    if (!workflow) return;
    
    try {
      await executeWorkflow(workflow);
    } catch (error) {
      console.error("Error executing workflow:", error);
    }
  };

  return (
    <Container className="py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Workflow Designer</h1>
        <p className="text-muted-foreground">
          Create and manage orchestration workflows for MCP servers and agents.
        </p>
      </div>

      <Alert className="mb-6">
        <InfoIcon className="h-5 w-5" />
        <AlertTitle>Demo Mode</AlertTitle>
        <AlertDescription>
          This is a demo of the workflow designer with execution engine integration. Drag nodes from the sidebar to create a workflow,
          connect them by dragging from one handle to another, and execute the workflow to see it in
          action.
        </AlertDescription>
      </Alert>

      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={!selectedWorkflowId ? "default" : "outline"}
            onClick={handleCreateNewWorkflow}
          >
            New Workflow
          </Button>

          <Button
            variant={selectedWorkflowId === exampleWorkflow.id ? "default" : "outline"}
            onClick={() => setSelectedWorkflowId(exampleWorkflow.id)}
          >
            Load Example
          </Button>

          {Object.values(workflows)
            .filter(w => w.id !== exampleWorkflow.id)
            .map((workflow) => (
              <Button
                key={workflow.id}
                variant={selectedWorkflowId === workflow.id ? "default" : "outline"}
                onClick={() => setSelectedWorkflowId(workflow.id)}
                className="flex items-center gap-1"
              >
                {workflow.name}
                <Badge variant="secondary" className="ml-1 text-xs">
                  v{workflow.version}
                </Badge>
              </Button>
            ))}
        </div>

        <div className="flex items-center gap-2">
          {isExecuting ? (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={cancelExecution}
              className="flex items-center gap-1"
            >
              <StopCircle className="h-4 w-4" />
              Cancel Execution
            </Button>
          ) : (
            <Button 
              variant="default" 
              size="sm"
              onClick={handleExecuteWorkflow}
              disabled={!workflow || workflow.nodes.length === 0}
              className="flex items-center gap-1"
            >
              <Play className="h-4 w-4" />
              Execute Workflow
            </Button>
          )}
          
          <Badge className="px-2 py-1" variant="outline">
            {Object.keys(workflows).length} workflows
          </Badge>
        </div>
      </div>

      <Card className="h-[800px] overflow-hidden">
        <WorkflowDesigner
          workflow={workflow || undefined}
          onSave={handleSaveWorkflow}
          showExecution={true}
        />
      </Card>
    </Container>
  );
}