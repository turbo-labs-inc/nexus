import { Node, Edge } from "reactflow";
import { NodeData } from "../types";

/**
 * Workflow scheduler
 * Determines the order in which nodes should be executed
 */
export class WorkflowScheduler {
  /**
   * Get the execution order for nodes
   * Uses topological sorting to ensure nodes are executed after their dependencies
   */
  getExecutionOrder(nodes: Node<NodeData>[], edges: Edge[]): string[] {
    // Build a graph of dependencies
    const graph = this.buildDependencyGraph(nodes, edges);
    
    // Perform topological sort
    return this.topologicalSort(graph);
  }
  
  /**
   * Build a graph representing node dependencies
   * Maps each node ID to an array of node IDs it depends on
   */
  private buildDependencyGraph(
    nodes: Node<NodeData>[],
    edges: Edge[]
  ): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    // Initialize with empty dependencies
    nodes.forEach((node) => {
      graph.set(node.id, []);
    });
    
    // Add edges as dependencies (target depends on source)
    edges.forEach((edge) => {
      if (!graph.has(edge.target)) {
        graph.set(edge.target, []);
      }
      
      const dependencies = graph.get(edge.target) || [];
      if (!dependencies.includes(edge.source)) {
        dependencies.push(edge.source);
        graph.set(edge.target, dependencies);
      }
    });
    
    return graph;
  }
  
  /**
   * Perform topological sort to determine execution order
   * This ensures that nodes are executed after all of their dependencies
   */
  private topologicalSort(graph: Map<string, string[]>): string[] {
    const visited = new Set<string>();
    const temp = new Set<string>();
    const order: string[] = [];
    
    // Helper function for DFS
    const visit = (nodeId: string) => {
      // If node is in temporary set, we have a cycle
      if (temp.has(nodeId)) {
        throw new Error("Workflow has circular dependencies");
      }
      
      // If node has already been visited, skip it
      if (visited.has(nodeId)) {
        return;
      }
      
      // Mark node as temporarily visited
      temp.add(nodeId);
      
      // Visit all dependencies
      const dependencies = graph.get(nodeId) || [];
      dependencies.forEach((dep) => visit(dep));
      
      // Mark node as permanently visited
      temp.delete(nodeId);
      visited.add(nodeId);
      
      // Add node to execution order
      order.push(nodeId);
    };
    
    // Visit all nodes
    for (const nodeId of graph.keys()) {
      if (!visited.has(nodeId)) {
        visit(nodeId);
      }
    }
    
    // Reverse the order to get the correct execution sequence
    // (dependencies first, then dependent nodes)
    return order.reverse();
  }
  
  /**
   * Find all nodes that should run in parallel
   * Returns groups of nodes that can be executed simultaneously
   */
  getParallelExecutionGroups(nodes: Node<NodeData>[], edges: Edge[]): string[][] {
    // Build the dependency graph
    const graph = this.buildDependencyGraph(nodes, edges);
    
    // Build the reverse graph (which nodes depend on this node)
    const reverseGraph = new Map<string, string[]>();
    
    // Initialize with empty arrays
    nodes.forEach((node) => {
      reverseGraph.set(node.id, []);
    });
    
    // Add reverse dependencies
    edges.forEach((edge) => {
      if (!reverseGraph.has(edge.source)) {
        reverseGraph.set(edge.source, []);
      }
      
      const dependents = reverseGraph.get(edge.source) || [];
      if (!dependents.includes(edge.target)) {
        dependents.push(edge.target);
        reverseGraph.set(edge.source, dependents);
      }
    });
    
    // Calculate node levels (distance from start)
    const levels = new Map<string, number>();
    
    // Find source nodes (nodes with no dependencies)
    const sourceNodes = Array.from(graph.entries())
      .filter(([_, deps]) => deps.length === 0)
      .map(([id]) => id);
    
    // Initialize source nodes with level 0
    sourceNodes.forEach((id) => levels.set(id, 0));
    
    // Perform BFS to assign levels
    const queue = [...sourceNodes];
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      const nodeLevel = levels.get(nodeId)!;
      
      // Process all dependent nodes
      const dependents = reverseGraph.get(nodeId) || [];
      for (const depId of dependents) {
        // A node's level is one more than its highest dependency
        const currentLevel = levels.get(depId) || 0;
        const newLevel = Math.max(currentLevel, nodeLevel + 1);
        levels.set(depId, newLevel);
        
        // Add to queue if not already visited
        if (!queue.includes(depId)) {
          queue.push(depId);
        }
      }
    }
    
    // Group nodes by level
    const levelGroups: Record<number, string[]> = {};
    for (const [nodeId, level] of levels.entries()) {
      if (!levelGroups[level]) {
        levelGroups[level] = [];
      }
      levelGroups[level].push(nodeId);
    }
    
    // Convert to array of arrays and sort by level
    return Object.entries(levelGroups)
      .sort(([levelA], [levelB]) => Number(levelA) - Number(levelB))
      .map(([_, nodes]) => nodes);
  }
}