import { useState, useEffect, useRef } from "react";
import { NodeExecutor } from "../execution/executor";
import { createWorkflowEngine, WorkflowExecutionEngine } from "../execution";
import { Workflow, ExecutionStatus, NodeData } from "../types";
import { ExecutionContext } from "../execution/context";
import { useWorkflowStore } from "../store";

interface UseWorkflowExecutionOptions {
  onExecutionStart?: () => void
  onExecutionComplete?: (context: ExecutionContext) => void
  onExecutionError?: (error: Error) => void
  onNodeStatusChange?: (nodeId: string, status: ExecutionStatus) => void
}

/**
 * React hook for workflow execution
 * Provides functionality to execute and manage workflows
 */
export function useWorkflowExecution(options: UseWorkflowExecutionOptions = {}) {
  // Execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionContext, setExecutionContext] = useState<ExecutionContext | null>(null);
  
  // Create engine instance 
  const engineRef = useRef<WorkflowExecutionEngine | null>(null);
  
  // Get workflows from store
  const { 
    getCurrentWorkflow, 
    updateWorkflow,
    setIsExecuting: setStoreIsExecuting
  } = useWorkflowStore();
  
  // Initialize engine
  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = createWorkflowEngine();
    }
    
    return () => {
      engineRef.current = null;
    };
  }, []);
  
  /**
   * Register a custom node executor
   */
  const registerExecutor = (nodeType: string, executor: NodeExecutor) => {
    if (engineRef.current) {
      engineRef.current.registerExecutor(nodeType, executor);
    }
  };
  
  /**
   * Execute the current workflow
   */
  const executeCurrentWorkflow = async () => {
    const workflow = getCurrentWorkflow();
    if (!workflow) {
      throw new Error("No current workflow to execute");
    }
    
    return executeWorkflow(workflow);
  };
  
  /**
   * Execute a workflow
   */
  const executeWorkflow = async (workflow: Workflow) => {
    if (!engineRef.current) {
      throw new Error("Workflow engine not initialized");
    }
    
    if (isExecuting) {
      return;
    }
    
    try {
      setIsExecuting(true);
      setStoreIsExecuting(true);
      
      // Call the start callback
      options.onExecutionStart?.();
      
      // Reset node statuses in workflow
      const updatedNodes = workflow.nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          status: ExecutionStatus.QUEUED,
          error: undefined,
          result: undefined,
        } as NodeData
      }));
      
      // Update workflow status
      updateWorkflow(workflow.id, {
        status: ExecutionStatus.RUNNING,
        nodes: updatedNodes,
      });
      
      // Execute the workflow
      const context = await engineRef.current.executeWorkflow({
        ...workflow,
        nodes: updatedNodes,
      });
      
      // Set the result
      setExecutionContext(context);
      
      // Update node statuses in workflow
      const nodesWithStatus = workflow.nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          status: context.nodeStatuses[node.id] || ExecutionStatus.SKIPPED,
          error: context.nodeErrors[node.id]?.message,
          result: context.nodeResults[node.id],
        } as NodeData
      }));
      
      // Update workflow
      updateWorkflow(workflow.id, {
        status: context.status,
        nodes: nodesWithStatus,
        lastExecutionTime: context.endTime?.toISOString(),
        lastExecutionStatus: context.status,
      });
      
      // Call the completion callback
      options.onExecutionComplete?.(context);
      
      return context;
    } catch (error) {
      console.error("Workflow execution failed:", error);
      
      // Update workflow status
      updateWorkflow(workflow.id, {
        status: ExecutionStatus.FAILED,
        lastExecutionStatus: ExecutionStatus.FAILED,
        lastExecutionTime: new Date().toISOString(),
      });
      
      // Call the error callback
      options.onExecutionError?.(error instanceof Error ? error : new Error(String(error)));
      
      throw error;
    } finally {
      setIsExecuting(false);
      setStoreIsExecuting(false);
    }
  };
  
  /**
   * Cancel the current execution
   */
  const cancelExecution = () => {
    if (engineRef.current && executionContext && isExecuting) {
      engineRef.current.cancelExecution(executionContext);
    }
  };
  
  return {
    isExecuting,
    executionContext,
    executeWorkflow,
    executeCurrentWorkflow,
    cancelExecution,
    registerExecutor,
  };
}