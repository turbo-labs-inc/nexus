import { ExecutionStatus } from "../types";

/**
 * Execution context for workflow execution
 * Stores execution state, results, errors, and variables
 */
export interface ExecutionContext {
  workflowId: string
  executionId: string
  startTime: Date
  endTime?: Date
  status: ExecutionStatus
  
  // Node execution results
  nodeResults: Record<string, any>
  nodeErrors: Record<string, Error>
  nodeStatuses: Record<string, ExecutionStatus>
  
  // Context variables
  variables: Record<string, any>
  
  // Methods
  setNodeResult: (nodeId: string, result: any) => void
  setNodeError: (nodeId: string, error: Error) => void
  setNodeStatus: (nodeId: string, status: ExecutionStatus) => void
  getNodeResult: (nodeId: string) => any
  setVariable: (name: string, value: any) => void
  getVariable: (name: string) => any
}

/**
 * Create a new execution context for a workflow
 */
export function createExecutionContext(
  workflowId: string,
  initialNodeIds: string[]
): ExecutionContext {
  const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  // Initial node statuses (all queued)
  const nodeStatuses: Record<string, ExecutionStatus> = {};
  initialNodeIds.forEach((id) => {
    nodeStatuses[id] = ExecutionStatus.QUEUED;
  });
  
  // State storage
  const nodeResults: Record<string, any> = {};
  const nodeErrors: Record<string, Error> = {};
  const variables: Record<string, any> = {};
  
  // Create the context
  const context: ExecutionContext = {
    workflowId,
    executionId,
    startTime: new Date(),
    status: ExecutionStatus.RUNNING,
    
    // Storage
    nodeResults,
    nodeErrors,
    nodeStatuses,
    variables,
    
    // Methods
    setNodeResult: (nodeId: string, result: any) => {
      nodeResults[nodeId] = result;
    },
    
    setNodeError: (nodeId: string, error: Error) => {
      nodeErrors[nodeId] = error;
    },
    
    setNodeStatus: (nodeId: string, status: ExecutionStatus) => {
      nodeStatuses[nodeId] = status;
    },
    
    getNodeResult: (nodeId: string) => {
      return nodeResults[nodeId];
    },
    
    setVariable: (name: string, value: any) => {
      variables[name] = value;
    },
    
    getVariable: (name: string) => {
      return variables[name];
    },
  };
  
  return context;
}

/**
 * Create a serializable version of the execution context
 * (to be stored in the workflow store)
 */
export function serializeExecutionContext(context: ExecutionContext): any {
  return {
    workflowId: context.workflowId,
    executionId: context.executionId,
    startTime: context.startTime.toISOString(),
    endTime: context.endTime ? context.endTime.toISOString() : undefined,
    status: context.status,
    nodeResults: context.nodeResults,
    nodeErrors: Object.fromEntries(
      Object.entries(context.nodeErrors).map(([key, error]) => [
        key,
        error.message,
      ])
    ),
    nodeStatuses: context.nodeStatuses,
    variables: context.variables,
    executionTime: context.endTime
      ? context.endTime.getTime() - context.startTime.getTime()
      : undefined,
  };
}