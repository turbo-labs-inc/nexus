import { Node, Edge } from "reactflow";
import { BaseNodeExecutor } from "../executor";
import { ExecutionContext } from "../context";
import { InputNodeData } from "@/lib/workflow/types";

/**
 * Executor for input nodes
 * These nodes provide input values to the workflow
 */
export class InputNodeExecutor extends BaseNodeExecutor<InputNodeData> {
  /**
   * Execute the input node
   * Simply takes the value from the node data and adds it to the context
   */
  async execute(
    node: Node<InputNodeData>,
    context: ExecutionContext,
    edges: Edge[]
  ): Promise<void> {
    return this.executeWithErrorHandling(node, context, async () => {
      // Get the input value from the node data or default value
      const value = node.data.value !== undefined 
        ? node.data.value 
        : node.data.defaultValue;
      
      // Set variable with node's label as the name
      context.setVariable(node.data.label || node.id, value);
      
      return value;
    });
  }
  
  /**
   * Input nodes don't have required inputs
   */
  getRequiredInputs(_node: Node<InputNodeData>): string[] {
    return [];
  }
  
  /**
   * Input nodes produce a single output with the node label or ID
   */
  getProducedOutputs(node: Node<InputNodeData>): string[] {
    return [node.data.label || node.id];
  }
  
  /**
   * Input nodes are always valid (they don't depend on other nodes)
   */
  validateInputs(_node: Node<InputNodeData>, _context: ExecutionContext, _edges: Edge[]): boolean {
    return true;
  }
}