import { Node, Edge } from "reactflow";
import { BaseNodeExecutor } from "../executor";
import { ExecutionContext } from "../context";
import { DataTransformNodeData } from "@/lib/workflow/types";

/**
 * Executor for transform nodes
 * These nodes transform data between other nodes
 */
export class TransformNodeExecutor extends BaseNodeExecutor<DataTransformNodeData> {
  /**
   * Execute the transform node
   * Applies a transformation function to input data
   */
  async execute(
    node: Node<DataTransformNodeData>,
    context: ExecutionContext,
    edges: Edge[]
  ): Promise<void> {
    return this.executeWithErrorHandling(node, context, async () => {
      // Get input values
      const inputs = this.getInputValues(node, context, edges);
      
      // Get variables from context
      const variables = { ...context.variables };
      
      // Apply the transformation
      return this.applyTransform(node.data, inputs, variables);
    });
  }
  
  /**
   * Transform nodes require at least one input
   */
  getRequiredInputs(_node: Node<DataTransformNodeData>): string[] {
    return ["input"];
  }
  
  /**
   * Transform nodes produce a single output
   */
  getProducedOutputs(node: Node<DataTransformNodeData>): string[] {
    return [`${node.id}_result`];
  }
  
  /**
   * Apply a transformation to input data
   */
  private async applyTransform(
    data: DataTransformNodeData,
    inputs: Record<string, any>,
    variables: Record<string, any>
  ): Promise<any> {
    const { transformType, transformFunction } = data;
    
    // Handle built-in transform types
    switch (transformType) {
      case "map":
        if (Array.isArray(inputs.input)) {
          // For arrays, apply the transform function to each item
          try {
            // Create a function that maps each item
            const mapFn = new Function(
              "item",
              "index",
              "array",
              "variables",
              transformFunction || "return item"
            );
            
            // Apply to each item
            return inputs.input.map((item: any, index: number, array: any[]) => 
              mapFn(item, index, array, variables)
            );
          } catch (error) {
            console.error("Error in map transformation:", error);
            throw new Error(`Map transformation failed: ${error instanceof Error ? error.message : String(error)}`);
          }
        } else {
          throw new Error("Map transformation requires an array input");
        }
        
      case "filter":
        if (Array.isArray(inputs.input)) {
          // For arrays, filter items based on the function
          try {
            // Create a function that filters items
            const filterFn = new Function(
              "item",
              "index",
              "array",
              "variables",
              `return Boolean(${transformFunction || "true"})`
            );
            
            // Apply to filter items
            return inputs.input.filter((item: any, index: number, array: any[]) => 
              filterFn(item, index, array, variables)
            );
          } catch (error) {
            console.error("Error in filter transformation:", error);
            throw new Error(`Filter transformation failed: ${error instanceof Error ? error.message : String(error)}`);
          }
        } else {
          throw new Error("Filter transformation requires an array input");
        }
        
      case "reduce":
        if (Array.isArray(inputs.input)) {
          // For arrays, reduce to a single value
          try {
            // Parse initial value if provided as a data property
            const initialValue = data.initialValue !== undefined 
              ? JSON.parse(data.initialValue)
              : undefined;
            
            // Create a reduce function
            const reduceFn = new Function(
              "accumulator",
              "item",
              "index",
              "array",
              "variables",
              transformFunction || "return accumulator"
            );
            
            // Apply reduction
            return inputs.input.reduce(
              (acc: any, item: any, index: number, array: any[]) => 
                reduceFn(acc, item, index, array, variables),
              initialValue
            );
          } catch (error) {
            console.error("Error in reduce transformation:", error);
            throw new Error(`Reduce transformation failed: ${error instanceof Error ? error.message : String(error)}`);
          }
        } else {
          throw new Error("Reduce transformation requires an array input");
        }
        
      case "custom":
      default:
        // For custom transformations, evaluate the transform function
        try {
          // Create a function with inputs and variables available
          const customFn = new Function(
            "input",
            "inputs",
            "variables",
            transformFunction || "return input"
          );
          
          // Call with the input data
          return customFn(
            // For convenience, provide the first input directly
            Object.values(inputs)[0],
            inputs,
            variables
          );
        } catch (error) {
          console.error("Error in custom transformation:", error);
          throw new Error(`Custom transformation failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
  }
}