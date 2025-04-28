import { Node, Edge } from "reactflow";
import { BaseNodeExecutor } from "../executor";
import { ExecutionContext } from "../context";
import { OutputNodeData } from "@/lib/workflow/types";

/**
 * Executor for output nodes
 * These nodes collect values from the workflow and make them available as outputs
 */
export class OutputNodeExecutor extends BaseNodeExecutor<OutputNodeData> {
  /**
   * Execute the output node
   * Takes input values and stores them as outputs
   */
  async execute(
    node: Node<OutputNodeData>,
    context: ExecutionContext,
    edges: Edge[]
  ): Promise<void> {
    return this.executeWithErrorHandling(node, context, async () => {
      // Get input values from connected nodes
      const inputs = this.getInputValues(node, context, edges);
      
      // If there's exactly one input, use it directly
      const result = Object.keys(inputs).length === 1 
        ? Object.values(inputs)[0]
        : inputs;
      
      // Set variable with node's label as the name
      context.setVariable(node.data.label || `output_${node.id}`, result);
      
      return result;
    });
  }
  
  /**
   * Output nodes typically require at least one input
   */
  getRequiredInputs(_node: Node<OutputNodeData>): string[] {
    return ["input"];
  }
  
  /**
   * Output nodes don't produce outputs (they are final nodes)
   */
  getProducedOutputs(_node: Node<OutputNodeData>): string[] {
    return [];
  }
  
  /**
   * Output nodes need at least one input to be valid
   */
  validateInputs(node: Node<OutputNodeData>, context: ExecutionContext, edges: Edge[]): boolean {
    // Get all incoming edges
    const incomingEdges = edges.filter((edge) => edge.target === node.id);
    
    // Need at least one input
    if (incomingEdges.length === 0) {
      return false;
    }
    
    // Check if any source node executed successfully
    let hasValidInput = false;
    for (const edge of incomingEdges) {
      const sourceNodeStatus = context.nodeStatuses[edge.source];
      if (sourceNodeStatus === "succeeded") {
        hasValidInput = true;
        break;
      }
    }
    
    return hasValidInput;
  }
}