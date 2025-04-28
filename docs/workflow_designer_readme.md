# Workflow Designer Component

## Overview

The Workflow Designer is a key component of the Nexus project, allowing users to visually create, edit, and execute workflows involving various node types such as MCP tools, Fast-Agents, prompts, and more. It provides a drag-and-drop interface for connecting different nodes to create orchestration pipelines.

## Features

- Drag-and-drop interface for creating workflows
- Multiple node types (Input, Output, MCP Tool, Fast-Agent, Prompt, Transform, Condition)
- Node configuration dialogs for customizing node behavior
- Workflow execution simulation
- Workflow saving and loading
- Undo/redo functionality
- Node duplication and deletion
- Real-time workflow execution visualization

## Implementation Details

### Key Components

1. **WorkflowDesigner**: The main container component that provides the React Flow context
2. **BaseNode**: Base component for all node types
3. **Node Configuration Dialogs**: Specialized dialogs for each node type
   - BaseConfigDialog: The foundation for all configuration dialogs
   - TypeSpecific Dialogs: Specialized dialogs for different node types (Input, Output, etc.)

### Node Types

- **Input Node**: Defines input parameters for the workflow
- **Output Node**: Defines the workflow output
- **MCP Tool Node**: Executes an MCP tool on a server
- **Fast-Agent Node**: Uses a Fast-Agent with specific instructions
- **Prompt Node**: Uses a prompt template with variables
- **Condition Node**: Branches workflow based on conditions
- **Transform Node**: Transforms data between nodes
- **Note Node**: Adds documentation to the workflow

### Data Flow

1. User creates nodes via drag-and-drop
2. Nodes are connected by dragging from output handles to input handles
3. Node configurations can be edited via configuration dialogs
4. Workflow execution follows the defined node connections
5. Data flows between nodes based on their connections

## Component Structure

```
/components/workflow/
├── workflow-designer.tsx      # Main workflow designer component
├── nodes/                     # Node type implementations
│   ├── base-node.tsx          # Base node component
│   ├── condition-node.tsx     # Condition node
│   ├── fast-agent-node.tsx    # Fast-Agent node
│   ├── io-nodes.tsx           # Input/Output nodes
│   ├── mcp-tool-node.tsx      # MCP Tool node
│   ├── prompt-node.tsx        # Prompt node
│   └── transform-node.tsx     # Transform node
└── node-config/               # Node configuration dialogs
    ├── base-config-dialog.tsx # Base configuration dialog
    ├── condition-node-config.tsx
    ├── input-node-config.tsx
    ├── note-node-config.tsx
    ├── output-node-config.tsx
    └── transform-node-config.tsx
```

## Testing

The Workflow Designer components are tested at multiple levels:

1. **Unit Tests**: Testing individual node components and configuration dialogs
2. **Integration Tests**: Testing the interaction between components
3. **End-to-End Tests**: Testing the complete workflow creation and execution process

See the test files in:
- `src/components/workflow/__tests__/`
- `src/components/workflow/node-config/__tests__/`
- `cypress/e2e/workflow-designer.cy.ts`

## Future Enhancements

1. **Real Workflow Execution**: Replace simulation with actual workflow execution
2. **Workflow Templates**: Add the ability to save and use workflow templates
3. **Versioning**: Add version control for workflows
4. **Visual Execution**: Enhanced visual feedback during execution
5. **Export/Import**: Support for exporting and importing workflows
6. **Validation**: Add validation to prevent invalid workflow configurations
7. **Search & Replace**: Add the ability to search and replace node configurations
8. **Grouping**: Support for grouping nodes together
9. **Subflows**: Allow workflows to include other workflows as nodes
10. **Performance Optimization**: Improve performance for large workflows

## Usage Example

```tsx
import { WorkflowDesigner } from "@/components/workflow/workflow-designer";

function WorkflowPage() {
  const handleSaveWorkflow = (workflow) => {
    // Save workflow to database or state
    console.log("Workflow saved:", workflow);
  };

  return (
    <div className="h-[800px]">
      <WorkflowDesigner 
        onSave={handleSaveWorkflow}
        showExecution={true}
      />
    </div>
  );
}
```