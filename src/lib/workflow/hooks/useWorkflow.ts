import { useCallback } from "react";
import { Edge, Node, OnNodesChange, OnEdgesChange, OnConnect, applyNodeChanges, applyEdgeChanges, addEdge } from "reactflow";
import { useWorkflowStore } from "../store";
import { Workflow, NodeData } from "../types";

/**
 * React hook for working with workflow data
 * Provides functionality to manage workflows and their nodes/edges
 */
export function useWorkflow(workflowId?: string) {
  const { 
    workflows, 
    currentWorkflowId,
    setCurrentWorkflow,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    duplicateWorkflow,
    updateNodes,
    updateEdges,
    getCurrentWorkflow,
  } = useWorkflowStore();
  
  // Use the provided workflowId or the current one
  const id = workflowId || currentWorkflowId;
  
  // Get the current workflow
  const workflow = id ? workflows[id] : null;
  
  // Handler for node changes
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      if (!id || !workflow) return;
      
      const updatedNodes = applyNodeChanges(changes, workflow.nodes as Node<NodeData>[]);
      updateNodes(id, updatedNodes);
    },
    [id, workflow, updateNodes]
  );
  
  // Handler for edge changes
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      if (!id || !workflow) return;
      
      const updatedEdges = applyEdgeChanges(changes, workflow.edges);
      updateEdges(id, updatedEdges);
    },
    [id, workflow, updateEdges]
  );
  
  // Handler for connecting nodes
  const onConnect: OnConnect = useCallback(
    (connection) => {
      if (!id || !workflow) return;
      
      const updatedEdges = addEdge(
        {
          ...connection,
          id: `e${connection.source}-${connection.target}`,
        },
        workflow.edges
      );
      updateEdges(id, updatedEdges);
    },
    [id, workflow, updateEdges]
  );
  
  // Create a new workflow
  const createNewWorkflow = useCallback(
    (name: string, description?: string) => {
      return createWorkflow(name, description);
    },
    [createWorkflow]
  );
  
  // Update workflow data
  const updateWorkflowData = useCallback(
    (data: Partial<Workflow>) => {
      if (!id) return;
      
      updateWorkflow(id, data);
    },
    [id, updateWorkflow]
  );
  
  // Save workflow (for when the whole workflow object is updated)
  const saveWorkflow = useCallback(
    (workflow: Workflow) => {
      updateWorkflow(workflow.id, workflow);
    },
    [updateWorkflow]
  );
  
  return {
    workflow,
    workflows,
    currentWorkflowId,
    setCurrentWorkflow,
    onNodesChange,
    onEdgesChange,
    onConnect,
    createWorkflow: createNewWorkflow,
    updateWorkflow: updateWorkflowData,
    deleteWorkflow,
    duplicateWorkflow,
    saveWorkflow,
    getCurrentWorkflow,
  };
}