import { Node, Edge } from "reactflow";
import { NodeData, ExecutionStatus } from "../types";
import { ExecutionContext } from "./context";

/**
 * Interface for node executors
 * Each node type needs its own executor implementation
 */
export interface NodeExecutor<T extends NodeData = NodeData> {
  /**
   * Execute the node and update the context with results
   */
  execute: (node: Node<T>, context: ExecutionContext, edges: Edge[]) => Promise<void>
  
  /**
   * Check if the node has all required inputs available
   */
  validateInputs: (node: Node<T>, context: ExecutionContext, edges: Edge[]) => boolean
  
  /**
   * Get list of input values a node requires
   */
  getRequiredInputs: (node: Node<T>) => string[]
  
  /**
   * Get list of outputs this node produces
   */
  getProducedOutputs: (node: Node<T>) => string[]
}

/**
 * Base class for node executors with common functionality
 */
export abstract class BaseNodeExecutor<T extends NodeData = NodeData> implements NodeExecutor<T> {
  /**
   * Execute the node
   * This method should be overridden by specific node executors
   */
  abstract execute(node: Node<T>, context: ExecutionContext, edges: Edge[]): Promise<void>
  
  /**
   * Validate inputs
   * This method can be overridden by specific node executors
   */
  validateInputs(node: Node<T>, context: ExecutionContext, edges: Edge[]): boolean {
    const requiredInputs = this.getRequiredInputs(node);
    
    // If the node doesn't require any inputs, it's valid
    if (requiredInputs.length === 0) {
      return true;
    }
    
    // Get all incoming nodes
    const incomingEdges = edges.filter((edge) => edge.target === node.id);
    
    // Check if all source nodes executed successfully
    for (const edge of incomingEdges) {
      const sourceNodeStatus = context.nodeStatuses[edge.source];
      
      // If any source node failed, this node can't execute
      if (sourceNodeStatus !== "succeeded") {
        return false;
      }
    }
    
    // If we have at least one valid incoming edge, the node can execute
    // (specific node types may implement more specific validation)
    return incomingEdges.length > 0;
  }
  
  /**
   * Get list of required inputs
   * This method should be overridden by specific node executors
   */
  abstract getRequiredInputs(node: Node<T>): string[]
  
  /**
   * Get list of produced outputs
   * This method should be overridden by specific node executors
   */
  abstract getProducedOutputs(node: Node<T>): string[]
  
  /**
   * Get input values from connected nodes
   */
  protected getInputValues(node: Node<T>, context: ExecutionContext, edges: Edge[]): Record<string, any> {
    const inputs: Record<string, any> = {};
    
    // Get all incoming edges
    const incomingEdges = edges.filter((edge) => edge.target === node.id);
    
    // Get values from all source nodes
    for (const edge of incomingEdges) {
      const sourceNodeId = edge.source;
      const result = context.getNodeResult(sourceNodeId);
      
      if (result !== undefined) {
        // If the edge has a specific targetHandle, use it as the input name
        // Otherwise use the source node ID
        const inputName = edge.targetHandle || sourceNodeId;
        inputs[inputName] = result;
      }
    }
    
    return inputs;
  }
  
  /**
   * Process variables in a string by substituting {{varName}} with values from context
   */
  protected substituteVariables(template: string, variables: Record<string, any>): string {
    return template.replace(/{{([^{}]+)}}/g, (match, variable) => {
      const trimmedVar = variable.trim();
      return variables[trimmedVar] !== undefined
        ? String(variables[trimmedVar])
        : match;
    });
  }
  
  /**
   * Process a record of strings with variable substitution
   */
  protected processVariables(
    variables: Record<string, string>,
    context: Record<string, any>
  ): Record<string, string> {
    const processed: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(variables)) {
      processed[key] = this.substituteVariables(value, context);
    }
    
    return processed;
  }
  
  /**
   * Helper method to clean up specific error handling in executors
   */
  protected async executeWithErrorHandling(
    node: Node<T>,
    context: ExecutionContext,
    fn: () => Promise<any>
  ): Promise<void> {
    try {
      context.setNodeStatus(node.id, ExecutionStatus.RUNNING);
      const result = await fn();
      context.setNodeResult(node.id, result);
      context.setNodeStatus(node.id, ExecutionStatus.SUCCEEDED);
    } catch (error) {
      context.setNodeError(node.id, error instanceof Error ? error : new Error(String(error)));
      context.setNodeStatus(node.id, ExecutionStatus.FAILED);
      throw error;
    }
  }
}