# Workflow Execution Engine Implementation Plan

## Overview

The workflow designer currently has a visual interface for creating and configuring workflows, but lacks a fully functional execution engine. This document outlines the plan to implement a complete workflow execution engine that can process workflows with all node types and interact with MCP servers and Fast-Agents.

## Current Status

- Visual workflow designer implemented with ReactFlow
- Node configuration dialogs for all node types
- Basic workflow execution simulation
- No real data processing or node execution

## Implementation Plan

### Phase 1: Workflow Engine Core (2 weeks)

#### 1.1 Workflow Store
- Create a workflow store using Zustand or similar state management
- Implement persistence to local storage and Supabase
- Add version tracking for workflows

```typescript
// Example store structure
interface WorkflowStore {
  workflows: Record<string, Workflow>;
  currentWorkflow: Workflow | null;
  
  // Actions
  loadWorkflow: (id: string) => Promise<Workflow>;
  saveWorkflow: (workflow: Workflow) => Promise<string>;
  createNewWorkflow: (name: string) => Workflow;
  deleteWorkflow: (id: string) => Promise<void>;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => Promise<Workflow>;
}
```

#### 1.2 Execution Context
- Create an execution context for storing execution state
- Implement data passing between nodes
- Add context variables for accessing intermediate results

```typescript
interface ExecutionContext {
  workflowId: string;
  executionId: string;
  startTime: Date;
  endTime?: Date;
  status: ExecutionStatus;
  
  // Node execution results
  nodeResults: Record<string, any>;
  nodeErrors: Record<string, Error>;
  nodeStatuses: Record<string, ExecutionStatus>;
  
  // Context variables
  variables: Record<string, any>;
  
  // Methods
  setNodeResult: (nodeId: string, result: any) => void;
  setNodeError: (nodeId: string, error: Error) => void;
  setNodeStatus: (nodeId: string, status: ExecutionStatus) => void;
  getNodeResult: (nodeId: string) => any;
  setVariable: (name: string, value: any) => void;
  getVariable: (name: string) => any;
}
```

#### 1.3 Node Execution Interface
- Define execution interfaces for all node types
- Create standardized input/output formats
- Implement execution method for each node type

```typescript
interface NodeExecutor<T extends NodeData> {
  execute: (node: Node<T>, context: ExecutionContext) => Promise<void>;
  validateInputs: (node: Node<T>, context: ExecutionContext) => boolean;
  getRequiredInputs: (node: Node<T>) => string[];
  getProducedOutputs: (node: Node<T>) => string[];
}
```

### Phase 2: Node Type Implementations (3 weeks)

#### 2.1 Basic Node Types
- Input node implementation
- Output node implementation
- Transform node implementation
- Note node implementation (non-executable)

```typescript
// Example for the input node executor
class InputNodeExecutor implements NodeExecutor<InputNodeData> {
  async execute(node: Node<InputNodeData>, context: ExecutionContext): Promise<void> {
    try {
      // Get the input value from the node data or user input
      const value = node.data.value ?? node.data.defaultValue;
      
      // Set the result in the context
      context.setNodeResult(node.id, value);
      
      // Set variable with the node's label as the name
      context.setVariable(node.data.label, value);
      
      // Mark as succeeded
      context.setNodeStatus(node.id, ExecutionStatus.SUCCEEDED);
    } catch (error) {
      context.setNodeError(node.id, error as Error);
      context.setNodeStatus(node.id, ExecutionStatus.FAILED);
      throw error;
    }
  }
  
  // ... other methods
}
```

#### 2.2 Conditional Logic
- Condition node implementation
- Expression evaluation engine
- Branch selection based on condition

```typescript
class ConditionNodeExecutor implements NodeExecutor<ConditionNodeData> {
  async execute(node: Node<ConditionNodeData>, context: ExecutionContext): Promise<void> {
    try {
      // Get inputs from previous nodes
      const inputs = this.getInputValues(node, context);
      
      // Evaluate the condition
      const result = this.evaluateCondition(node.data, inputs, context);
      
      // Store the result
      context.setNodeResult(node.id, result);
      
      // Set the branch taken property for the workflow engine
      context.setVariable(`${node.id}_branch`, result ? 'true' : 'false');
      
      // Mark as succeeded
      context.setNodeStatus(node.id, ExecutionStatus.SUCCEEDED);
    } catch (error) {
      context.setNodeError(node.id, error as Error);
      context.setNodeStatus(node.id, ExecutionStatus.FAILED);
      throw error;
    }
  }
  
  // ... other methods
}
```

#### 2.3 MCP Integration
- MCP tool node implementation
- Connect to the MCP server manager
- Execute tools and process results

```typescript
class MCPToolNodeExecutor implements NodeExecutor<MCPToolNodeData> {
  private mcpManager: MCPServerManager;
  
  constructor() {
    this.mcpManager = getMCPServerManager();
  }
  
  async execute(node: Node<MCPToolNodeData>, context: ExecutionContext): Promise<void> {
    try {
      // Get the tool ID and parameters
      const { toolId, parameters } = node.data;
      
      // Replace parameter variables with context values
      const processedParams = this.processParameters(parameters, context);
      
      // Execute the tool
      context.setNodeStatus(node.id, ExecutionStatus.RUNNING);
      const result = await this.mcpManager.executeTool(toolId, processedParams);
      
      // Store the result
      context.setNodeResult(node.id, result);
      
      // Check for errors
      if (!result.success) {
        throw new Error(result.error?.message || 'Tool execution failed');
      }
      
      // Mark as succeeded
      context.setNodeStatus(node.id, ExecutionStatus.SUCCEEDED);
    } catch (error) {
      context.setNodeError(node.id, error as Error);
      context.setNodeStatus(node.id, ExecutionStatus.FAILED);
      throw error;
    }
  }
  
  // ... other methods
}
```

#### 2.4 Fast-Agent Integration
- Fast-Agent node implementation
- Connect to the Fast-Agent bridge
- Handle messages and responses

```typescript
class FastAgentNodeExecutor implements NodeExecutor<FastAgentNodeData> {
  private bridgeRef: React.MutableRefObject<FastAgentBridge | null>;
  
  constructor(bridgeRef: React.MutableRefObject<FastAgentBridge | null>) {
    this.bridgeRef = bridgeRef;
  }
  
  async execute(node: Node<FastAgentNodeData>, context: ExecutionContext): Promise<void> {
    try {
      // Get the bridge
      const bridge = this.bridgeRef.current;
      if (!bridge) {
        throw new Error('Fast-Agent bridge not initialized');
      }
      
      // Check connection
      if (!bridge.isConnected()) {
        await bridge.connect();
      }
      
      // Get the instruction and inputs
      const { instruction } = node.data;
      const inputs = this.getInputValues(node, context);
      
      // Process the instruction with input variables
      const processedInstruction = this.processInstruction(instruction, inputs);
      
      // Set up message listener for response
      const messagePromise = new Promise<FastAgentMessage>((resolve, reject) => {
        const timeout = setTimeout(() => {
          bridge.off('message', messageHandler);
          reject(new Error('Fast-Agent response timeout'));
        }, 30000);
        
        const messageHandler = (message: FastAgentMessage) => {
          if (message.type === MessageType.ASSISTANT_MESSAGE) {
            clearTimeout(timeout);
            bridge.off('message', messageHandler);
            resolve(message);
          }
        };
        
        bridge.on('message', messageHandler);
      });
      
      // Send the message
      context.setNodeStatus(node.id, ExecutionStatus.RUNNING);
      await bridge.sendMessage(MessageType.USER_MESSAGE, { 
        content: processedInstruction,
        context: inputs
      });
      
      // Wait for the response
      const response = await messagePromise;
      
      // Store the result
      context.setNodeResult(node.id, response.data);
      
      // Mark as succeeded
      context.setNodeStatus(node.id, ExecutionStatus.SUCCEEDED);
    } catch (error) {
      context.setNodeError(node.id, error as Error);
      context.setNodeStatus(node.id, ExecutionStatus.FAILED);
      throw error;
    }
  }
  
  // ... other methods
}
```

#### 2.5 Prompt Template Integration
- Prompt node implementation
- Variable substitution in templates
- Connect to MCP prompt rendering if available

```typescript
class PromptNodeExecutor implements NodeExecutor<PromptNodeData> {
  private mcpManager: MCPServerManager;
  
  constructor() {
    this.mcpManager = getMCPServerManager();
  }
  
  async execute(node: Node<PromptNodeData>, context: ExecutionContext): Promise<void> {
    try {
      // Get the prompt template and variables
      const { promptTemplate, variables, promptId } = node.data;
      
      // Process variables with context values
      const processedVariables = this.processVariables(variables, context);
      
      let renderedPrompt: string;
      
      // If we have a prompt ID, use MCP prompt rendering
      if (promptId) {
        context.setNodeStatus(node.id, ExecutionStatus.RUNNING);
        const result = await this.mcpManager.renderPrompt(promptId, processedVariables);
        
        if (!result.success) {
          throw new Error(result.error?.message || 'Prompt rendering failed');
        }
        
        renderedPrompt = result.renderedPrompt;
      } else {
        // Otherwise, do local variable substitution
        renderedPrompt = this.substituteVariables(promptTemplate, processedVariables);
      }
      
      // Store the result
      context.setNodeResult(node.id, { renderedPrompt });
      
      // Mark as succeeded
      context.setNodeStatus(node.id, ExecutionStatus.SUCCEEDED);
    } catch (error) {
      context.setNodeError(node.id, error as Error);
      context.setNodeStatus(node.id, ExecutionStatus.FAILED);
      throw error;
    }
  }
  
  // ... other methods
}
```

### Phase 3: Workflow Engine Integration (2 weeks)

#### 3.1 Execution Scheduler
- Build a workflow scheduler
- Implement topological sort for execution order
- Handle parallel execution where possible

```typescript
class WorkflowScheduler {
  // Get the execution order for nodes
  getExecutionOrder(nodes: Node[], edges: Edge[]): string[] {
    // Build a graph of dependencies
    const graph = this.buildDependencyGraph(nodes, edges);
    
    // Perform topological sort
    return this.topologicalSort(graph);
  }
  
  // Build a graph representing node dependencies
  private buildDependencyGraph(nodes: Node[], edges: Edge[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    // Initialize with empty dependencies
    nodes.forEach(node => {
      graph.set(node.id, []);
    });
    
    // Add edges as dependencies
    edges.forEach(edge => {
      const dependencies = graph.get(edge.target) || [];
      dependencies.push(edge.source);
      graph.set(edge.target, dependencies);
    });
    
    return graph;
  }
  
  // Perform topological sort to determine execution order
  private topologicalSort(graph: Map<string, string[]>): string[] {
    const visited = new Set<string>();
    const temp = new Set<string>();
    const order: string[] = [];
    
    // Helper function for DFS
    const visit = (nodeId: string) => {
      if (temp.has(nodeId)) {
        throw new Error('Workflow has circular dependencies');
      }
      
      if (!visited.has(nodeId)) {
        temp.add(nodeId);
        
        const dependencies = graph.get(nodeId) || [];
        dependencies.forEach(dep => visit(dep));
        
        temp.delete(nodeId);
        visited.add(nodeId);
        order.push(nodeId);
      }
    };
    
    // Visit all nodes
    for (const nodeId of graph.keys()) {
      if (!visited.has(nodeId)) {
        visit(nodeId);
      }
    }
    
    return order.reverse();
  }
}
```

#### 3.2 Execution Engine
- Main execution engine implementation
- Support for cancellation and pausing
- Handling of branching logic

```typescript
class WorkflowExecutionEngine {
  private scheduler: WorkflowScheduler;
  private nodeExecutors: Map<string, NodeExecutor<any>>;
  
  constructor() {
    this.scheduler = new WorkflowScheduler();
    this.nodeExecutors = this.initializeExecutors();
  }
  
  // Initialize all node executors
  private initializeExecutors(): Map<string, NodeExecutor<any>> {
    const executors = new Map();
    
    executors.set(NodeType.INPUT, new InputNodeExecutor());
    executors.set(NodeType.OUTPUT, new OutputNodeExecutor());
    executors.set(NodeType.CONDITION, new ConditionNodeExecutor());
    executors.set(NodeType.DATA_TRANSFORM, new TransformNodeExecutor());
    executors.set(NodeType.PROMPT, new PromptNodeExecutor());
    executors.set(NodeType.MCP_TOOL, new MCPToolNodeExecutor());
    executors.set(NodeType.FAST_AGENT, new FastAgentNodeExecutor(this.bridgeRef));
    
    return executors;
  }
  
  // Execute a workflow
  async executeWorkflow(workflow: Workflow): Promise<ExecutionContext> {
    // Create execution context
    const context = this.createExecutionContext(workflow);
    
    try {
      // Get execution order
      const executionOrder = this.scheduler.getExecutionOrder(workflow.nodes, workflow.edges);
      
      // Execute nodes in order
      for (const nodeId of executionOrder) {
        // Check if we should continue execution
        if (context.status === ExecutionStatus.CANCELLED) {
          break;
        }
        
        // Find the node
        const node = workflow.nodes.find(n => n.id === nodeId);
        if (!node) continue;
        
        // Check if we should skip this node based on conditions
        if (this.shouldSkipNode(node, workflow.edges, context)) {
          context.setNodeStatus(nodeId, ExecutionStatus.SKIPPED);
          continue;
        }
        
        // Get the appropriate executor
        const executor = this.nodeExecutors.get(node.type);
        if (!executor) {
          context.setNodeError(nodeId, new Error(`No executor found for node type: ${node.type}`));
          context.setNodeStatus(nodeId, ExecutionStatus.FAILED);
          throw new Error(`No executor found for node type: ${node.type}`);
        }
        
        // Execute the node
        try {
          context.setNodeStatus(nodeId, ExecutionStatus.RUNNING);
          await executor.execute(node, context);
        } catch (error) {
          // Node execution failed, but we continue with the next node if possible
          console.error(`Error executing node ${nodeId}:`, error);
        }
      }
      
      // Set final status
      const hasFailures = Object.values(context.nodeStatuses).some(
        status => status === ExecutionStatus.FAILED
      );
      
      context.status = hasFailures ? ExecutionStatus.FAILED : ExecutionStatus.SUCCEEDED;
      context.endTime = new Date();
      
      return context;
    } catch (error) {
      // Handle critical errors that stop the entire workflow
      context.status = ExecutionStatus.FAILED;
      context.endTime = new Date();
      console.error('Workflow execution failed:', error);
      return context;
    }
  }
  
  // Check if a node should be skipped based on conditions
  private shouldSkipNode(node: Node, edges: Edge[], context: ExecutionContext): boolean {
    // For condition node outputs, check which branch was taken
    const incomingConditionEdges = edges.filter(
      e => e.target === node.id && e.source.startsWith(NodeType.CONDITION)
    );
    
    for (const edge of incomingConditionEdges) {
      const conditionNodeId = edge.source;
      const branchValue = context.getVariable(`${conditionNodeId}_branch`);
      
      // If this is the false branch but the condition was true, skip
      if (edge.sourceHandle === 'output-1' && branchValue === 'true') {
        return true;
      }
      
      // If this is the true branch but the condition was false, skip
      if (edge.sourceHandle === 'output-0' && branchValue === 'false') {
        return true;
      }
    }
    
    // Check if any input nodes failed
    const incomingEdges = edges.filter(e => e.target === node.id);
    for (const edge of incomingEdges) {
      const inputNodeStatus = context.nodeStatuses[edge.source];
      if (inputNodeStatus === ExecutionStatus.FAILED) {
        return true; // Skip if any input node failed
      }
    }
    
    return false;
  }
  
  // Create execution context
  private createExecutionContext(workflow: Workflow): ExecutionContext {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    return {
      workflowId: workflow.id,
      executionId,
      startTime: new Date(),
      status: ExecutionStatus.RUNNING,
      
      // Initialize empty results
      nodeResults: {},
      nodeErrors: {},
      nodeStatuses: workflow.nodes.reduce((acc, node) => {
        acc[node.id] = ExecutionStatus.QUEUED;
        return acc;
      }, {} as Record<string, ExecutionStatus>),
      
      // Initialize empty variables
      variables: {},
      
      // Methods
      setNodeResult: (nodeId: string, result: any) => {
        this.nodeResults[nodeId] = result;
      },
      
      setNodeError: (nodeId: string, error: Error) => {
        this.nodeErrors[nodeId] = error;
      },
      
      setNodeStatus: (nodeId: string, status: ExecutionStatus) => {
        this.nodeStatuses[nodeId] = status;
      },
      
      getNodeResult: (nodeId: string) => {
        return this.nodeResults[nodeId];
      },
      
      setVariable: (name: string, value: any) => {
        this.variables[name] = value;
      },
      
      getVariable: (name: string) => {
        return this.variables[name];
      }
    };
  }
  
  // Cancel a running workflow
  cancelExecution(context: ExecutionContext): void {
    if (context.status === ExecutionStatus.RUNNING) {
      context.status = ExecutionStatus.CANCELLED;
      context.endTime = new Date();
    }
  }
}
```

#### 3.3 UI Integration
- Connect execution engine to UI
- Show real-time execution status
- Display results and errors

```typescript
// WorkflowExecutionPanel.tsx
function WorkflowExecutionPanel({ workflow }: { workflow: Workflow }) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionContext, setExecutionContext] = useState<ExecutionContext | null>(null);
  const executionEngine = useRef<WorkflowExecutionEngine>(new WorkflowExecutionEngine());
  
  // Start execution
  const handleExecute = async () => {
    setIsExecuting(true);
    
    try {
      const context = await executionEngine.current.executeWorkflow(workflow);
      setExecutionContext(context);
    } catch (error) {
      console.error('Execution failed:', error);
    } finally {
      setIsExecuting(false);
    }
  };
  
  // Cancel execution
  const handleCancel = () => {
    if (executionContext && executionContext.status === ExecutionStatus.RUNNING) {
      executionEngine.current.cancelExecution(executionContext);
    }
  };
  
  return (
    <div className="execution-panel">
      <div className="controls">
        {isExecuting ? (
          <Button variant="destructive" onClick={handleCancel}>Cancel Execution</Button>
        ) : (
          <Button onClick={handleExecute}>Execute Workflow</Button>
        )}
      </div>
      
      {executionContext && (
        <div className="execution-results">
          <div className="summary">
            <h3>Execution Summary</h3>
            <div className="status">
              Status: <Badge variant={getStatusVariant(executionContext.status)}>
                {executionContext.status}
              </Badge>
            </div>
            <div className="time">
              Duration: {executionContext.endTime ? 
                formatDuration(executionContext.startTime, executionContext.endTime) : 
                'Running...'}
            </div>
          </div>
          
          <div className="node-results">
            <h3>Node Results</h3>
            {workflow.nodes.map(node => (
              <NodeResultCard 
                key={node.id}
                node={node}
                status={executionContext.nodeStatuses[node.id]}
                result={executionContext.nodeResults[node.id]}
                error={executionContext.nodeErrors[node.id]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### Phase 4: Advanced Features (2 weeks)

#### 4.1 Execution History
- Store execution history
- View past executions
- Compare execution results

#### 4.2 Workflows as Templates
- Save workflows as reusable templates
- Share templates between users
- Version control for templates

#### 4.3 Workflow Export/Import
- Export workflows to JSON
- Import workflows from JSON
- Validate imported workflows

#### 4.4 Parameterized Workflows
- Define workflow parameters
- Override parameters at execution time
- Save parameter presets

### Phase 5: Testing and Documentation (1 week)

#### 5.1 Unit Tests
- Test all node executors
- Test workflow scheduler
- Test execution engine

#### 5.2 Integration Tests
- Test workflow execution with MCP
- Test workflow execution with Fast-Agent
- Test execution history and templates

#### 5.3 Documentation
- Document workflow engine architecture
- Create usage examples
- Document node types and their configurations

## Timeline

- Phase 1 (Workflow Engine Core): Weeks 1-2
- Phase 2 (Node Type Implementations): Weeks 3-5
- Phase 3 (Workflow Engine Integration): Weeks 6-7
- Phase 4 (Advanced Features): Weeks 8-9
- Phase 5 (Testing and Documentation): Week 10

Total estimated time: 10 weeks

## Dependencies

- MCP Server Infrastructure must be complete
- Fast-Agent Bridge must be operational
- UI components for workflow designer must be complete

## Expected Outcomes

1. Fully functional workflow execution engine
2. Integration with MCP and Fast-Agent
3. Real-time execution monitoring
4. Execution history and templates
5. Export/import functionality
6. Comprehensive tests and documentation

## Future Enhancements

- Scheduled workflow execution
- Looping and iteration support
- Advanced error handling and recovery
- Distributed execution
- Real-time collaboration on workflows
- Nested workflows (subflows)