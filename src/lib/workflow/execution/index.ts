import { WorkflowExecutionEngine } from "./engine";
import { WorkflowScheduler } from "./scheduler";
import { createNodeExecutors } from "./executors";
import { createExecutionContext, serializeExecutionContext } from "./context";
import { NodeExecutor, BaseNodeExecutor } from "./executor";

/**
 * Initialize and return a workflow execution engine with all registered executors
 */
export function createWorkflowEngine(): WorkflowExecutionEngine {
  // Create and register node executors
  const nodeExecutors = createNodeExecutors();
  
  // Create the engine with executors
  return new WorkflowExecutionEngine(nodeExecutors);
}

export { 
  WorkflowExecutionEngine,
  WorkflowScheduler,
  createExecutionContext,
  serializeExecutionContext
};

// Export types
export type { NodeExecutor, BaseNodeExecutor };

// Export executors
export * from "./executors";