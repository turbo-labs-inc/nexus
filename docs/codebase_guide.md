# Nexus Codebase Guide

This document provides a high-level overview of the Nexus project codebase, explaining the key directories, components, and their purposes.

## Project Structure

```
/src
  /app                 # Next.js app router
  /components          # React components
    /auth              # Authentication components
    /chat              # Chat interface components
    /layout            # Layout components
    /pwa               # Progressive Web App components
    /servers           # Server management components
    /ui                # Base UI components (shadcn/ui)
    /workflow          # Workflow orchestration components
      /node-config     # Node configuration dialogs
      /nodes           # Custom node implementations
  /context             # React context providers
  /hooks               # Custom React hooks
  /lib                 # Utility functions and core logic
    /fast-agent        # Fast-Agent bridge
    /mcp               # MCP integration
    /pwa               # PWA utilities
    /supabase          # Supabase client
    /utils             # General utilities
    /workflow          # Workflow types and utilities
  /middleware.ts       # Next.js middleware (auth)
/fast_agent            # Python Fast-Agent server
/public                # Static assets
/docs                  # Documentation
```

## Key Components

### App Router (`/src/app`)

- **app/page.tsx**: Landing page
- **app/layout.tsx**: Root layout with providers
- **app/api/**: API endpoints, including MCP server operations
- **app/auth/**: Authentication pages
- **app/chat/**: Chat interface
- **app/servers/**: Server management
- **app/workflow-demo/**: Workflow designer demo

### Components (`/src/components`)

#### Authentication (`/components/auth`)
- **login-form.tsx**: Login form
- **signup-form.tsx**: Registration form
- **profile-form.tsx**: User profile management

#### Chat Interface (`/components/chat`)
- **chat-container.tsx**: Main chat interface container
- **chat-message.tsx**: Message component
- **chat-input.tsx**: Input component
- **fast-agent-chat.tsx**: Fast-Agent integration

#### Layout (`/components/layout`)
- **container.tsx**: Page container
- **header.tsx**: Navigation header
- **main-layout.tsx**: Main layout structure

#### Server Management (`/components/servers`)
- **server-form.tsx**: Server configuration form
- **server-list.tsx**: List of managed servers
- **server-detail.tsx**: Server details view
- **server-monitoring.tsx**: Server status monitoring

#### Workflow Designer (`/components/workflow`)
- **workflow-designer.tsx**: Main workflow designer component

##### Node Implementations (`/components/workflow/nodes`)
- **base-node.tsx**: Base node component for inheritance
- **condition-node.tsx**: Conditional branching node
- **fast-agent-node.tsx**: Fast-Agent integration node
- **io-nodes.tsx**: Input/output nodes
- **mcp-tool-node.tsx**: MCP tool execution node
- **prompt-node.tsx**: Prompt template node
- **transform-node.tsx**: Data transformation node

##### Node Configuration (`/components/workflow/node-config`)
- **base-config-dialog.tsx**: Base configuration dialog
- **condition-node-config.tsx**: Condition node configuration
- **input-node-config.tsx**: Input node configuration
- **output-node-config.tsx**: Output node configuration
- **transform-node-config.tsx**: Transform node configuration

### Core Libraries (`/src/lib`)

#### Fast-Agent Bridge (`/lib/fast-agent`)
- **bridge.ts**: WebSocket bridge to Python Fast-Agent
- **types.ts**: Type definitions for Fast-Agent communication

##### Hooks (`/lib/fast-agent/hooks`)
- **use-fast-agent.ts**: React hook for Fast-Agent interaction
- **use-fast-agent-tools.ts**: Tool integration for Fast-Agent

#### MCP Integration (`/lib/mcp`)
- **types/index.ts**: MCP type definitions

##### Server (`/lib/mcp/server`)
- **manager.ts**: MCP server manager
- **client.ts**: HTTP client for MCP
- **ws-client.ts**: WebSocket client for MCP

##### Utils (`/lib/mcp/utils`)
- **error-handler.ts**: Error handling utilities
- **logger.ts**: Structured logging
- **metrics.ts**: Performance metrics collection

#### Workflow (`/lib/workflow`)
- **types.ts**: Type definitions for workflow components

### Python Fast-Agent (`/fast_agent`)
- **server.py**: FastAPI WebSocket server
- **requirements.txt**: Python dependencies

## Data Flow

### Authentication Flow
1. User enters credentials on login page
2. Supabase authentication is used to verify credentials
3. On success, user is redirected to dashboard
4. Auth context provides authentication state throughout the app

### Chat Flow
1. User enters a message in chat input
2. Message is sent to Fast-Agent bridge
3. Bridge forwards message to Python server via WebSocket
4. Python server processes the message
5. Response is returned through WebSocket
6. Bridge forwards response to chat UI
7. UI renders the response

### Workflow Execution Flow
1. User creates a workflow in the workflow designer
2. When executed, each node is processed sequentially
3. Input nodes provide initial data
4. Processing nodes (MCP tools, Fast-Agent, transforms) modify data
5. Condition nodes control flow direction
6. Output nodes collect results
7. Results are displayed to the user

### MCP Server Operations
1. User configures and connects to MCP servers
2. Server capabilities are registered in the capability registry
3. Tools, resources, and prompts are made available for use
4. Operations are executed through the server manager
5. Results are returned to the requesting component

## Testing Structure

```
/src
  /components
    /__tests__                    # Component tests
    /workflow
      /__tests__                  # Workflow component tests
      /node-config
        /__tests__                # Node configuration tests
  /lib
    /fast-agent
      /tests                      # Fast-Agent tests
    /mcp
      /__tests__                  # MCP integration tests
/cypress
  /e2e                            # End-to-end tests
  /fixtures                       # Test fixtures
  /support                        # Cypress support files
```

## Development Workflow

1. **Start the Next.js Development Server**:
   ```bash
   npm run dev
   ```

2. **Start the Python Fast-Agent Server**:
   ```bash
   cd fast_agent
   python server.py
   ```

3. **Run Tests**:
   ```bash
   npm test          # Run Jest tests
   npm run cypress   # Run Cypress tests
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```

## Key Technologies

- **Next.js 15**: App Router, React 19
- **TypeScript**: Type safety
- **Tailwind CSS 4**: Styling
- **Shadcn/UI**: UI component library
- **ReactFlow**: Workflow visualization
- **Supabase**: Authentication and data storage
- **FastAPI**: Python Fast-Agent server
- **WebSockets**: Real-time communication
- **Zod**: Runtime validation

## Further Documentation

- [Implementation Plan](./implementation_plan.md): Detailed project roadmap
- [Testing Strategy](./testing_strategy.md): Testing approach
- [Project Status Report](./project_status_report.md): Current implementation status