import { useCallback } from "react";
import { useWorkflowStore, WorkflowExecution } from "../store";

/**
 * React hook for working with workflow execution history
 * Provides functionality to access and manage workflow execution records
 */
export function useWorkflowHistory(workflowId?: string) {
  const { 
    workflows, 
    currentWorkflowId,
    executionHistory,
    getExecutionHistory,
  } = useWorkflowStore();
  
  // Use the provided workflowId or the current one
  const id = workflowId || currentWorkflowId;
  
  // Get the current workflow
  const workflow = id ? workflows[id] : null;
  
  // Get execution history for the workflow
  const history = id ? getExecutionHistory(id) : [];
  
  // Get latest execution
  const latestExecution = history.length > 0 
    ? history[history.length - 1] 
    : null;
  
  // Get the execution by ID
  const getExecution = useCallback(
    (executionId: string): WorkflowExecution | null => {
      return history.find(execution => execution.id === executionId) || null;
    },
    [history]
  );
  
  return {
    workflow,
    history,
    latestExecution,
    getExecution,
  };
}