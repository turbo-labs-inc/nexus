import { v4 as uuidv4 } from "uuid";
import { Workflow, NodeType, ExecutionStatus } from "./types";

/**
 * Serializes a workflow to a JSON string
 * @param workflow The workflow to serialize
 * @returns JSON string representation of the workflow
 */
export function serializeWorkflow(workflow: Workflow): string {
  // Create a clean version of the workflow for export
  const exportWorkflow: Workflow = {
    ...workflow,
    // Reset execution-related properties
    status: ExecutionStatus.IDLE,
    lastExecutionTime: undefined,
    lastExecutionStatus: undefined,
    nodes: workflow.nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        status: ExecutionStatus.IDLE,
        error: undefined,
        result: undefined,
        executionTime: undefined,
      }
    })),
  };

  return JSON.stringify(exportWorkflow, null, 2);
}

/**
 * Deserializes a workflow from a JSON string
 * @param json JSON string representation of the workflow
 * @param newId Whether to generate a new ID for the workflow
 * @returns The deserialized workflow
 */
export function deserializeWorkflow(json: string, newId: boolean = true): Workflow {
  try {
    const workflow: Workflow = JSON.parse(json);
    
    // Validate basic structure
    if (!workflow.nodes || !Array.isArray(workflow.nodes) || 
        !workflow.edges || !Array.isArray(workflow.edges)) {
      throw new Error("Invalid workflow structure");
    }
    
    // Update timestamps and generate new ID if needed
    const updatedWorkflow: Workflow = {
      ...workflow,
      id: newId ? `workflow-${uuidv4()}` : workflow.id,
      updatedAt: new Date().toISOString(),
      // Ensure a valid status
      status: ExecutionStatus.IDLE,
    };
    
    return updatedWorkflow;
  } catch (error) {
    console.error("Error deserializing workflow:", error);
    throw new Error("Failed to deserialize workflow");
  }
}

/**
 * Validates an imported workflow
 * @param workflow The workflow to validate
 * @returns Validation results with errors if any
 */
export function validateImportedWorkflow(workflow: Workflow): { 
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check required fields
  if (!workflow.id) errors.push("Workflow ID is missing");
  if (!workflow.name) errors.push("Workflow name is missing");
  if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
    errors.push("Workflow nodes are missing or invalid");
  }
  if (!workflow.edges || !Array.isArray(workflow.edges)) {
    errors.push("Workflow edges are missing or invalid");
  }
  
  // Check node types
  if (workflow.nodes) {
    for (const node of workflow.nodes) {
      if (!node.id) errors.push(`Node missing ID: ${JSON.stringify(node)}`);
      if (!node.type) errors.push(`Node missing type: ${node.id}`);
      if (!Object.values(NodeType).includes(node.type as NodeType)) {
        errors.push(`Invalid node type: ${node.type} for node ${node.id}`);
      }
      if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
        errors.push(`Invalid node position for node ${node.id}`);
      }
    }
  }
  
  // Check edge connections
  if (workflow.edges && workflow.nodes) {
    const nodeIds = workflow.nodes.map(n => n.id);
    for (const edge of workflow.edges) {
      if (!edge.id) errors.push(`Edge missing ID: ${JSON.stringify(edge)}`);
      if (!edge.source) errors.push(`Edge missing source: ${edge.id}`);
      if (!edge.target) errors.push(`Edge missing target: ${edge.id}`);
      
      // Check if source and target nodes exist
      if (!nodeIds.includes(edge.source)) {
        errors.push(`Edge ${edge.id} references non-existent source node: ${edge.source}`);
      }
      if (!nodeIds.includes(edge.target)) {
        errors.push(`Edge ${edge.id} references non-existent target node: ${edge.target}`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Exports a workflow to a file
 * @param workflow The workflow to export
 * @returns Blob of the workflow JSON
 */
export function exportWorkflowToFile(workflow: Workflow): Blob {
  const workflowJson = serializeWorkflow(workflow);
  return new Blob([workflowJson], { type: 'application/json' });
}

/**
 * Generates a file name for workflow export
 * @param workflow The workflow to generate a file name for
 * @returns Suggested file name
 */
export function getWorkflowFileName(workflow: Workflow): string {
  // Create a slug from the workflow name
  const nameSlug = workflow.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  
  // Add date for versioning
  const date = new Date().toISOString().split('T')[0];
  
  return `workflow-${nameSlug}-${date}.json`;
}

/**
 * Imports a workflow from a File object
 * @param file The file to import the workflow from
 * @param newId Whether to generate a new ID for the workflow
 * @returns Promise that resolves to the imported workflow
 */
export async function importWorkflowFromFile(
  file: File, 
  newId: boolean = true
): Promise<Workflow> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const workflow = deserializeWorkflow(json, newId);
        
        // Validate workflow
        const validation = validateImportedWorkflow(workflow);
        if (!validation.valid) {
          reject(new Error(`Invalid workflow: ${validation.errors.join(', ')}`));
          return;
        }
        
        resolve(workflow);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      reject(error);
    };
    
    reader.readAsText(file);
  });
}