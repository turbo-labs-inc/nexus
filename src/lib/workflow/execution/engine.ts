import { Node, Edge } from "reactflow";
import { NodeType, NodeData, ExecutionStatus, Workflow } from "../types";
import { ExecutionContext, createExecutionContext, serializeExecutionContext } from "./context";
import { NodeExecutor } from "./executor";
import { WorkflowScheduler } from "./scheduler";
import { WorkflowExecution, useWorkflowStore } from "../store";

/**
 * Workflow execution engine
 * Coordinates execution of nodes in a workflow
 */
export class WorkflowExecutionEngine {
  private scheduler: WorkflowScheduler;
  private nodeExecutors: Map<string, NodeExecutor<any>>;
  
  /**
   * Initialize the workflow execution engine
   * @param nodeExecutors Map of node executors by node type
   */
  constructor(nodeExecutors?: Map<string, NodeExecutor<any>>) {
    this.scheduler = new WorkflowScheduler();
    this.nodeExecutors = nodeExecutors || new Map();
  }
  
  /**
   * Register a node executor for a specific node type
   */
  registerExecutor(nodeType: string, executor: NodeExecutor<any>): void {
    this.nodeExecutors.set(nodeType, executor);
  }
  
  /**
   * Execute a workflow
   * @returns Execution context with results
   */
  async executeWorkflow(workflow: Workflow): Promise<ExecutionContext> {
    // Create execution context
    const context = createExecutionContext(
      workflow.id,
      workflow.nodes.map((n) => n.id)
    );
    
    try {
      // Get execution order
      const executionOrder = this.scheduler.getExecutionOrder(workflow.nodes, workflow.edges);
      
      // Execute nodes in order
      for (const nodeId of executionOrder) {
        // Check if execution is cancelled
        if (context.status === ExecutionStatus.CANCELLED) {
          break;
        }
        
        // Find the node
        const node = workflow.nodes.find((n) => n.id === nodeId);
        if (!node) {
          console.warn(`Node ${nodeId} not found in workflow`);
          continue;
        }
        
        // Get the appropriate executor
        const executor = this.nodeExecutors.get(node.type);
        if (!executor) {
          const error = new Error(`No executor registered for node type: ${node.type}`);
          context.setNodeError(nodeId, error);
          context.setNodeStatus(nodeId, ExecutionStatus.FAILED);
          console.error(error);
          continue;
        }
        
        // Check if we should skip this node based on conditions
        if (this.shouldSkipNode(node, workflow.edges, context)) {
          context.setNodeStatus(nodeId, ExecutionStatus.SKIPPED);
          continue;
        }
        
        // Check if inputs are valid
        if (!executor.validateInputs(node, context, workflow.edges)) {
          context.setNodeStatus(nodeId, ExecutionStatus.SKIPPED);
          console.warn(`Skipping node ${nodeId} due to invalid inputs`);
          continue;
        }
        
        // Execute the node
        try {
          context.setNodeStatus(nodeId, ExecutionStatus.RUNNING);
          await executor.execute(node, context, workflow.edges);
        } catch (error) {
          // Individual nodes handle their own errors, so we just log and continue
          console.error(`Error executing node ${nodeId}:`, error);
        }
      }
      
      // Set final status
      const hasFailures = Object.values(context.nodeStatuses).some(
        (status) => status === ExecutionStatus.FAILED
      );
      
      context.status = hasFailures
        ? ExecutionStatus.FAILED
        : context.status === ExecutionStatus.CANCELLED
        ? ExecutionStatus.CANCELLED
        : ExecutionStatus.SUCCEEDED;
      
      context.endTime = new Date();
      
      // Save execution record to store
      this.saveExecutionRecord(workflow.id, context);
      
      return context;
    } catch (error) {
      // Handle critical errors that stop the entire workflow
      console.error("Workflow execution failed:", error);
      
      context.status = ExecutionStatus.FAILED;
      context.endTime = new Date();
      
      // Save execution record even on failure
      this.saveExecutionRecord(workflow.id, context);
      
      return context;
    }
  }
  
  /**
   * Cancel a running workflow execution
   */
  cancelExecution(context: ExecutionContext): void {
    if (context.status === ExecutionStatus.RUNNING) {
      context.status = ExecutionStatus.CANCELLED;
      context.endTime = new Date();
    }
  }
  
  /**
   * Check if a node should be skipped based on conditions
   */
  private shouldSkipNode(
    node: Node<NodeData>,
    edges: Edge[],
    context: ExecutionContext
  ): boolean {
    // For condition node outputs, check which branch was taken
    const incomingConditionEdges = edges.filter(
      (e) => e.target === node.id && e.source.startsWith(NodeType.CONDITION)
    );
    
    for (const edge of incomingConditionEdges) {
      const conditionNodeId = edge.source;
      const branchValue = context.getVariable(`${conditionNodeId}_branch`);
      
      // If this is the false branch but the condition was true, skip
      if (edge.sourceHandle === "output-1" && branchValue === "true") {
        return true;
      }
      
      // If this is the true branch but the condition was false, skip
      if (edge.sourceHandle === "output-0" && branchValue === "false") {
        return true;
      }
    }
    
    // Check if any input nodes failed that we depend on
    const incomingEdges = edges.filter((e) => e.target === node.id);
    for (const edge of incomingEdges) {
      const inputNodeStatus = context.nodeStatuses[edge.source];
      if (
        inputNodeStatus === ExecutionStatus.FAILED ||
        inputNodeStatus === ExecutionStatus.SKIPPED
      ) {
        return true; // Skip if any input node failed or was skipped
      }
    }
    
    return false;
  }
  
  /**
   * Save execution record to the store
   */
  private saveExecutionRecord(workflowId: string | undefined, context: ExecutionContext): void {
    if (!workflowId) return;
    
    // Get serializable version of context
    const executionRecord = serializeExecutionContext(context) as WorkflowExecution;
    
    // Add to store
    useWorkflowStore.getState().addExecutionRecord(workflowId, executionRecord);
  }
}