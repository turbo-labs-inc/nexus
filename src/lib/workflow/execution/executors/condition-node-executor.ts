import { Node, Edge } from "reactflow";
import { BaseNodeExecutor } from "../executor";
import { ExecutionContext } from "../context";
import { ConditionNodeData } from "@/lib/workflow/types";

/**
 * Executor for condition nodes
 * These nodes evaluate conditions and control branching in workflows
 */
export class ConditionNodeExecutor extends BaseNodeExecutor<ConditionNodeData> {
  /**
   * Execute the condition node
   * Evaluates a condition and determines which branch to take
   */
  async execute(
    node: Node<ConditionNodeData>,
    context: ExecutionContext,
    edges: Edge[]
  ): Promise<void> {
    return this.executeWithErrorHandling(node, context, async () => {
      // Get input values
      const inputs = this.getInputValues(node, context, edges);
      
      // Get variables from context
      const variables = { ...context.variables, ...inputs };
      
      // Evaluate the condition
      const result = await this.evaluateCondition(node.data, variables);
      
      // Store the branch taken for the execution engine
      context.setVariable(`${node.id}_branch`, result ? "true" : "false");
      
      return result;
    });
  }
  
  /**
   * Condition nodes require at least one input
   */
  getRequiredInputs(_node: Node<ConditionNodeData>): string[] {
    return ["input"];
  }
  
  /**
   * Condition nodes produce a boolean output
   */
  getProducedOutputs(node: Node<ConditionNodeData>): string[] {
    return [`${node.id}_result`];
  }
  
  /**
   * Evaluate a condition based on its type and values
   */
  private async evaluateCondition(
    data: ConditionNodeData,
    variables: Record<string, any>
  ): Promise<boolean> {
    const { conditionType, condition, leftValue, rightValue } = data;
    
    // Process variable values
    const leftProcessed = this.processValue(leftValue || "", variables);
    const rightProcessed = this.processValue(rightValue || "", variables);
    
    // Standard condition types
    switch (conditionType) {
      case "equals":
        return leftProcessed === rightProcessed;
        
      case "contains":
        return typeof leftProcessed === "string" && 
               typeof rightProcessed === "string" && 
               leftProcessed.includes(rightProcessed);
        
      case "greater":
        return Number(leftProcessed) > Number(rightProcessed);
        
      case "less":
        return Number(leftProcessed) < Number(rightProcessed);
        
      case "custom":
        // For custom conditions, evaluate the condition string as code
        // with variables available in scope
        try {
          // Create a function that can access the variables
          const evalFn = new Function(
            ...Object.keys(variables),
            `return ${condition}`
          );
          
          // Call the function with variable values
          return Boolean(evalFn(...Object.values(variables)));
        } catch (error) {
          console.error("Error evaluating custom condition:", error);
          return false;
        }
        
      default:
        return false;
    }
  }
  
  /**
   * Process a value string, replacing variables and evaluating expressions
   */
  private processValue(value: string, variables: Record<string, any>): any {
    // First check if it's a direct variable reference
    if (value.startsWith("{{") && value.endsWith("}}")) {
      const varName = value.slice(2, -2).trim();
      return variables[varName];
    }
    
    // Otherwise perform variable substitution
    return this.substituteVariables(value, variables);
  }
}