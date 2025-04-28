# Server-Side MCP Capabilities Implementation

This document outlines the implementation of server-side MCP (Model Context Protocol) capabilities for the Next.js PWA. This implementation builds upon the Fast-Agent bridge chat component to provide advanced MCP features that are hosted on the server rather than the client.

## Overview

The server-side MCP implementation follows these key principles:

1. The MCP capabilities are hosted on the server, not the client
2. The implementation leverages Fast-Agent for communication with MCP servers
3. The UI provides management interfaces for MCP capabilities
4. The architecture supports orchestration of multiple MCP servers

## Architecture

The server-side MCP implementation consists of the following components:

1. **MCP Server Manager**: Manages the lifecycle of MCP servers
2. **MCP Capability Registry**: Registers and tracks available MCP capabilities
3. **MCP Orchestration Engine**: Coordinates workflows across multiple MCP servers
4. **MCP API Layer**: Exposes MCP capabilities to the client through REST and WebSocket APIs

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js Application                       │
├─────────────────┬─────────────────────────┬─────────────────────┤
│                 │                         │                     │
│  Client-Side    │     Server-Side         │    MCP Server       │
│  Components     │     Components          │    Infrastructure   │
│                 │                         │                     │
├─────────────────┤                         ├─────────────────────┤
│                 │                         │                     │
│ - Chat UI       │                         │ - MCP Server        │
│ - File Upload   │                         │   Manager           │
│ - Settings UI   │                         │                     │
│ - Admin Panel   │                         │ - MCP Capability    │
│                 │                         │   Registry          │
├─────────────────┤                         │                     │
│                 │                         │ - MCP Orchestration │
│ - WebSocket     │                         │   Engine            │
│   Client        │                         │                     │
│                 │                         ├─────────────────────┤
│ - REST API      │                         │                     │
│   Client        │                         │ - Tool Servers      │
│                 │                         │ - Resource Servers  │
├─────────────────┤                         │ - Prompt Servers    │
│                 │                         │                     │
│ Fast-Agent      │                         ├─────────────────────┤
│ Bridge          │                         │                     │
│                 │                         │ - Python Runtime    │
└─────────────────┴─────────────────────────┴─────────────────────┘
```

## Implementation Details

### 1. MCP Server Manager

The MCP Server Manager is responsible for:

- Starting and stopping MCP servers
- Monitoring server health
- Managing server configurations
- Handling server registration and discovery

```typescript
// src/lib/mcp/server-manager.ts
import { spawn, ChildProcess } from "child_process";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";

export interface McpServerConfig {
  id: string;
  name: string;
  type: "tool" | "resource" | "prompt";
  command: string;
  args: string[];
  env?: Record<string, string>;
  workingDir?: string;
  autoStart?: boolean;
}

export class McpServerManager {
  private servers: Map<
    string,
    {
      config: McpServerConfig;
      process: ChildProcess | null;
      status: "stopped" | "starting" | "running" | "error";
      lastError?: string;
    }
  > = new Map();

  private configDir: string;

  constructor(configDir: string) {
    this.configDir = configDir;

    // Create config directory if it doesn't exist
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    // Load existing server configurations
    this.loadConfigurations();
  }

  private loadConfigurations() {
    const configFiles = fs.readdirSync(this.configDir).filter((file) => file.endsWith(".json"));

    for (const file of configFiles) {
      try {
        const configPath = path.join(this.configDir, file);
        const configData = fs.readFileSync(configPath, "utf8");
        const config = JSON.parse(configData) as McpServerConfig;

        this.servers.set(config.id, {
          config,
          process: null,
          status: "stopped",
        });

        // Auto-start servers if configured
        if (config.autoStart) {
          this.startServer(config.id);
        }
      } catch (error) {
        console.error(`Failed to load server configuration from ${file}:`, error);
      }
    }
  }

  async registerServer(config: Omit<McpServerConfig, "id">): Promise<string> {
    const id = uuidv4();
    const serverConfig: McpServerConfig = {
      ...config,
      id,
    };

    // Save configuration to file
    const configPath = path.join(this.configDir, `${id}.json`);
    fs.writeFileSync(configPath, JSON.stringify(serverConfig, null, 2));

    // Add to servers map
    this.servers.set(id, {
      config: serverConfig,
      process: null,
      status: "stopped",
    });

    return id;
  }

  async startServer(id: string): Promise<boolean> {
    const server = this.servers.get(id);
    if (!server) {
      throw new Error(`Server with ID ${id} not found`);
    }

    if (server.status === "running") {
      return true; // Already running
    }

    try {
      // Update status
      server.status = "starting";

      // Prepare environment variables
      const env = {
        ...process.env,
        ...server.config.env,
      };

      // Spawn the server process
      const serverProcess = spawn(server.config.command, server.config.args, {
        env,
        cwd: server.config.workingDir || process.cwd(),
        stdio: ["pipe", "pipe", "pipe"],
      });

      // Handle process events
      serverProcess.on("error", (error) => {
        server.status = "error";
        server.lastError = error.message;
        console.error(`Server ${id} error:`, error);
      });

      serverProcess.on("exit", (code) => {
        server.status = "stopped";
        server.process = null;
        console.log(`Server ${id} exited with code ${code}`);
      });

      // Capture stdout and stderr
      serverProcess.stdout?.on("data", (data) => {
        console.log(`[Server ${id}] stdout:`, data.toString());
      });

      serverProcess.stderr?.on("data", (data) => {
        console.error(`[Server ${id}] stderr:`, data.toString());
      });

      // Update server record
      server.process = serverProcess;
      server.status = "running";

      return true;
    } catch (error) {
      server.status = "error";
      server.lastError = error.message;
      console.error(`Failed to start server ${id}:`, error);
      return false;
    }
  }

  async stopServer(id: string): Promise<boolean> {
    const server = this.servers.get(id);
    if (!server) {
      throw new Error(`Server with ID ${id} not found`);
    }

    if (server.status !== "running" || !server.process) {
      return true; // Already stopped
    }

    try {
      // Send SIGTERM to gracefully terminate
      server.process.kill("SIGTERM");

      // Wait for process to exit
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          // Force kill if it doesn't exit within 5 seconds
          if (server.process) {
            server.process.kill("SIGKILL");
          }
          resolve();
        }, 5000);

        server.process.on("exit", () => {
          clearTimeout(timeout);
          resolve();
        });
      });

      server.process = null;
      server.status = "stopped";

      return true;
    } catch (error) {
      console.error(`Failed to stop server ${id}:`, error);
      return false;
    }
  }

  async restartServer(id: string): Promise<boolean> {
    await this.stopServer(id);
    return this.startServer(id);
  }

  getServerStatus(id: string) {
    const server = this.servers.get(id);
    if (!server) {
      throw new Error(`Server with ID ${id} not found`);
    }

    return {
      id: server.config.id,
      name: server.config.name,
      type: server.config.type,
      status: server.status,
      lastError: server.lastError,
    };
  }

  getAllServers() {
    return Array.from(this.servers.entries()).map(([id, server]) => ({
      id,
      name: server.config.name,
      type: server.config.type,
      status: server.status,
      lastError: server.lastError,
    }));
  }

  async removeServer(id: string): Promise<boolean> {
    const server = this.servers.get(id);
    if (!server) {
      throw new Error(`Server with ID ${id} not found`);
    }

    // Stop the server if it's running
    if (server.status === "running") {
      await this.stopServer(id);
    }

    // Remove configuration file
    const configPath = path.join(this.configDir, `${id}.json`);
    if (fs.existsSync(configPath)) {
      fs.unlinkSync(configPath);
    }

    // Remove from servers map
    this.servers.delete(id);

    return true;
  }
}
```

### 2. MCP Capability Registry

The MCP Capability Registry tracks all available MCP capabilities across servers:

```typescript
// src/lib/mcp/capability-registry.ts
import { EventEmitter } from "events";

export interface McpTool {
  id: string;
  name: string;
  description: string;
  serverId: string;
  parameters: Record<string, any>;
  returnType: Record<string, any>;
}

export interface McpResource {
  id: string;
  name: string;
  description: string;
  serverId: string;
  schema: Record<string, any>;
}

export interface McpPrompt {
  id: string;
  name: string;
  description: string;
  serverId: string;
  content: string;
  variables: string[];
}

export class McpCapabilityRegistry extends EventEmitter {
  private tools: Map<string, McpTool> = new Map();
  private resources: Map<string, McpResource> = new Map();
  private prompts: Map<string, McpPrompt> = new Map();

  // Tool methods
  registerTool(tool: McpTool): void {
    this.tools.set(tool.id, tool);
    this.emit("tool:added", tool);
  }

  updateTool(id: string, updates: Partial<McpTool>): void {
    const tool = this.tools.get(id);
    if (!tool) {
      throw new Error(`Tool with ID ${id} not found`);
    }

    const updatedTool = { ...tool, ...updates };
    this.tools.set(id, updatedTool);
    this.emit("tool:updated", updatedTool);
  }

  removeTool(id: string): void {
    const tool = this.tools.get(id);
    if (!tool) {
      throw new Error(`Tool with ID ${id} not found`);
    }

    this.tools.delete(id);
    this.emit("tool:removed", tool);
  }

  getTool(id: string): McpTool | undefined {
    return this.tools.get(id);
  }

  getAllTools(): McpTool[] {
    return Array.from(this.tools.values());
  }

  getToolsByServer(serverId: string): McpTool[] {
    return Array.from(this.tools.values()).filter((tool) => tool.serverId === serverId);
  }

  // Resource methods
  registerResource(resource: McpResource): void {
    this.resources.set(resource.id, resource);
    this.emit("resource:added", resource);
  }

  updateResource(id: string, updates: Partial<McpResource>): void {
    const resource = this.resources.get(id);
    if (!resource) {
      throw new Error(`Resource with ID ${id} not found`);
    }

    const updatedResource = { ...resource, ...updates };
    this.resources.set(id, updatedResource);
    this.emit("resource:updated", updatedResource);
  }

  removeResource(id: string): void {
    const resource = this.resources.get(id);
    if (!resource) {
      throw new Error(`Resource with ID ${id} not found`);
    }

    this.resources.delete(id);
    this.emit("resource:removed", resource);
  }

  getResource(id: string): McpResource | undefined {
    return this.resources.get(id);
  }

  getAllResources(): McpResource[] {
    return Array.from(this.resources.values());
  }

  getResourcesByServer(serverId: string): McpResource[] {
    return Array.from(this.resources.values()).filter((resource) => resource.serverId === serverId);
  }

  // Prompt methods
  registerPrompt(prompt: McpPrompt): void {
    this.prompts.set(prompt.id, prompt);
    this.emit("prompt:added", prompt);
  }

  updatePrompt(id: string, updates: Partial<McpPrompt>): void {
    const prompt = this.prompts.get(id);
    if (!prompt) {
      throw new Error(`Prompt with ID ${id} not found`);
    }

    const updatedPrompt = { ...prompt, ...updates };
    this.prompts.set(id, updatedPrompt);
    this.emit("prompt:updated", updatedPrompt);
  }

  removePrompt(id: string): void {
    const prompt = this.prompts.get(id);
    if (!prompt) {
      throw new Error(`Prompt with ID ${id} not found`);
    }

    this.prompts.delete(id);
    this.emit("prompt:removed", prompt);
  }

  getPrompt(id: string): McpPrompt | undefined {
    return this.prompts.get(id);
  }

  getAllPrompts(): McpPrompt[] {
    return Array.from(this.prompts.values());
  }

  getPromptsByServer(serverId: string): McpPrompt[] {
    return Array.from(this.prompts.values()).filter((prompt) => prompt.serverId === serverId);
  }

  // Server-related methods
  removeServerCapabilities(serverId: string): void {
    // Remove all tools, resources, and prompts for this server
    for (const [id, tool] of this.tools.entries()) {
      if (tool.serverId === serverId) {
        this.tools.delete(id);
        this.emit("tool:removed", tool);
      }
    }

    for (const [id, resource] of this.resources.entries()) {
      if (resource.serverId === serverId) {
        this.resources.delete(id);
        this.emit("resource:removed", resource);
      }
    }

    for (const [id, prompt] of this.prompts.entries()) {
      if (prompt.serverId === serverId) {
        this.prompts.delete(id);
        this.emit("prompt:removed", prompt);
      }
    }
  }
}
```

### 3. MCP Orchestration Engine

The MCP Orchestration Engine coordinates workflows across multiple MCP servers:

```typescript
// src/lib/mcp/orchestration-engine.ts
import { v4 as uuidv4 } from "uuid";
import { McpCapabilityRegistry, McpTool, McpResource, McpPrompt } from "./capability-registry";
import { FastAgentBridge, FastAgentConfig } from "../fast-agent";

export interface WorkflowStep {
  id: string;
  type: "tool" | "resource" | "prompt" | "input" | "output" | "condition";
  name: string;
  config: Record<string, any>;
  nextSteps: string[];
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  entryPoint: string;
  variables: Record<string, any>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: "pending" | "running" | "completed" | "failed";
  currentStep: string | null;
  variables: Record<string, any>;
  results: Record<string, any>;
  error?: string;
  startTime: number;
  endTime?: number;
}

export class McpOrchestrationEngine {
  private workflows: Map<string, Workflow> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private registry: McpCapabilityRegistry;

  constructor(registry: McpCapabilityRegistry) {
    this.registry = registry;
  }

  registerWorkflow(workflow: Omit<Workflow, "id">): string {
    const id = uuidv4();
    const newWorkflow: Workflow = {
      ...workflow,
      id,
    };

    this.workflows.set(id, newWorkflow);
    return id;
  }

  updateWorkflow(id: string, updates: Partial<Workflow>): void {
    const workflow = this.workflows.get(id);
    if (!workflow) {
      throw new Error(`Workflow with ID ${id} not found`);
    }

    const updatedWorkflow = { ...workflow, ...updates };
    this.workflows.set(id, updatedWorkflow);
  }

  removeWorkflow(id: string): void {
    if (!this.workflows.has(id)) {
      throw new Error(`Workflow with ID ${id} not found`);
    }

    this.workflows.delete(id);
  }

  getWorkflow(id: string): Workflow | undefined {
    return this.workflows.get(id);
  }

  getAllWorkflows(): Workflow[] {
    return Array.from(this.workflows.values());
  }

  async executeWorkflow(
    workflowId: string,
    initialVariables: Record<string, any> = {}
  ): Promise<string> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow with ID ${workflowId} not found`);
    }

    const executionId = uuidv4();
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: "pending",
      currentStep: null,
      variables: { ...workflow.variables, ...initialVariables },
      results: {},
      startTime: Date.now(),
    };

    this.executions.set(executionId, execution);

    // Start execution asynchronously
    this.runWorkflow(executionId).catch((error) => {
      const execution = this.executions.get(executionId);
      if (execution) {
        execution.status = "failed";
        execution.error = error.message;
        execution.endTime = Date.now();
      }
    });

    return executionId;
  }

  getExecution(id: string): WorkflowExecution | undefined {
    return this.executions.get(id);
  }

  getAllExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values());
  }

  private async runWorkflow(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution with ID ${executionId} not found`);
    }

    const workflow = this.workflows.get(execution.workflowId);
    if (!workflow) {
      throw new Error(`Workflow with ID ${execution.workflowId} not found`);
    }

    try {
      // Update execution status
      execution.status = "running";
      execution.currentStep = workflow.entryPoint;

      // Execute steps starting from entry point
      await this.executeStep(executionId, workflow.entryPoint);

      // Mark execution as completed
      execution.status = "completed";
      execution.currentStep = null;
      execution.endTime = Date.now();
    } catch (error) {
      // Mark execution as failed
      execution.status = "failed";
      execution.error = error.message;
      execution.endTime = Date.now();

      throw error;
    }
  }

  private async executeStep(executionId: string, stepId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution with ID ${executionId} not found`);
    }

    const workflow = this.workflows.get(execution.workflowId);
    if (!workflow) {
      throw new Error(`Workflow with ID ${execution.workflowId} not found`);
    }

    const step = workflow.steps.find((s) => s.id === stepId);
    if (!step) {
      throw new Error(`Step with ID ${stepId} not found in workflow`);
    }

    // Update current step
    execution.currentStep = stepId;

    // Execute step based on type
    let result;
    switch (step.type) {
      case "tool":
        result = await this.executeTool(execution, step);
        break;
      case "resource":
        result = await this.accessResource(execution, step);
        break;
      case "prompt":
        result = await this.usePrompt(execution, step);
        break;
      case "input":
        result = this.processInput(execution, step);
        break;
      case "output":
        result = this.processOutput(execution, step);
        break;
      case "condition":
        result = this.evaluateCondition(execution, step);
        break;
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }

    // Store result
    execution.results[stepId] = result;

    // Execute next steps
    for (const nextStepId of step.nextSteps) {
      await this.executeStep(executionId, nextStepId);
    }
  }

  private async executeTool(execution: WorkflowExecution, step: WorkflowStep): Promise<any> {
    const { toolId, parameters } = step.config;

    // Get tool from registry
    const tool = this.registry.getTool(toolId);
    if (!tool) {
      throw new Error(`Tool with ID ${toolId} not found`);
    }

    // Prepare parameters with variable substitution
    const resolvedParams = this.resolveVariables(execution, parameters);

    // Execute tool using Fast-Agent
    const agentConfig: FastAgentConfig = {
      model: "gpt-4o",
      instruction: `Execute the tool "${tool.name}" with the provided parameters.`,
      servers: [tool.serverId],
    };

    const agent = new FastAgentBridge(agentConfig);
    await agent.initialize();

    try {
      // Format the tool execution message
      const message = `Execute tool: ${tool.name}\nParameters: ${JSON.stringify(resolvedParams, null, 2)}`;
      const response = await agent.sendMessage(message);

      // Parse the response
      return response.content;
    } finally {
      await agent.shutdown();
    }
  }

  private async accessResource(execution: WorkflowExecution, step: WorkflowStep): Promise<any> {
    const { resourceId, query } = step.config;

    // Get resource from registry
    const resource = this.registry.getResource(resourceId);
    if (!resource) {
      throw new Error(`Resource with ID ${resourceId} not found`);
    }

    // Prepare query with variable substitution
    const resolvedQuery = this.resolveVariables(execution, query);

    // Access resource using Fast-Agent
    const agentConfig: FastAgentConfig = {
      model: "gpt-4o",
      instruction: `Access the resource "${resource.name}" with the provided query.`,
      servers: [resource.serverId],
    };

    const agent = new FastAgentBridge(agentConfig);
    await agent.initialize();

    try {
      // Format the resource access message
      const message = `Access resource: ${resource.name}\nQuery: ${JSON.stringify(resolvedQuery, null, 2)}`;
      const response = await agent.sendMessage(message);

      // Parse the response
      return response.content;
    } finally {
      await agent.shutdown();
    }
  }

  private async usePrompt(execution: WorkflowExecution, step: WorkflowStep): Promise<any> {
    const { promptId, variables } = step.config;

    // Get prompt from registry
    const prompt = this.registry.getPrompt(promptId);
    if (!prompt) {
      throw new Error(`Prompt with ID ${promptId} not found`);
    }

    // Prepare variables with variable substitution
    const resolvedVars = this.resolveVariables(execution, variables);

    // Use prompt with Fast-Agent
    const agentConfig: FastAgentConfig = {
      model: "gpt-4o",
      instruction: `Use the prompt "${prompt.name}" with the provided variables.`,
      servers: [prompt.serverId],
    };

    const agent = new FastAgentBridge(agentConfig);
    await agent.initialize();

    try {
      // Format the prompt usage message
      const message = `Use prompt: ${prompt.name}\nVariables: ${JSON.stringify(resolvedVars, null, 2)}`;
      const response = await agent.sendMessage(message);

      // Parse the response
      return response.content;
    } finally {
      await agent.shutdown();
    }
  }

  private processInput(execution: WorkflowExecution, step: WorkflowStep): any {
    const { inputKey, defaultValue } = step.config;

    // Get input from execution variables
    return execution.variables[inputKey] !== undefined
      ? execution.variables[inputKey]
      : defaultValue;
  }

  private processOutput(execution: WorkflowExecution, step: WorkflowStep): any {
    const { outputKey, value } = step.config;

    // Resolve value with variable substitution
    const resolvedValue = this.resolveVariables(execution, value);

    // Store in execution variables
    execution.variables[outputKey] = resolvedValue;

    return resolvedValue;
  }

  private evaluateCondition(execution: WorkflowExecution, step: WorkflowStep): boolean {
    const { condition } = step.config;

    // Simple condition evaluation (can be expanded for more complex conditions)
    const { left, operator, right } = condition;

    // Resolve variables
    const leftValue = this.resolveVariable(execution, left);
    const rightValue = this.resolveVariable(execution, right);

    // Evaluate condition
    switch (operator) {
      case "==":
        return leftValue == rightValue;
      case "!=":
        return leftValue != rightValue;
      case ">":
        return leftValue > rightValue;
      case ">=":
        return leftValue >= rightValue;
      case "<":
        return leftValue < rightValue;
      case "<=":
        return leftValue <= rightValue;
      default:
        throw new Error(`Unknown operator: ${operator}`);
    }
  }

  private resolveVariables(execution: WorkflowExecution, obj: any): any {
    if (typeof obj === "string" && obj.startsWith("$")) {
      return this.resolveVariable(execution, obj);
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.resolveVariables(execution, item));
    }

    if (obj !== null && typeof obj === "object") {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.resolveVariables(execution, value);
      }
      return result;
    }

    return obj;
  }

  private resolveVariable(execution: WorkflowExecution, varName: string): any {
    if (!varName.startsWith("$")) {
      return varName;
    }

    const path = varName.substring(1).split(".");

    if (path[0] === "variables") {
      let value = execution.variables;
      for (let i = 1; i < path.length; i++) {
        if (value === undefined) return undefined;
        value = value[path[i]];
      }
      return value;
    }

    if (path[0] === "results") {
      if (path.length < 2) return execution.results;

      const stepId = path[1];
      const result = execution.results[stepId];

      if (path.length === 2) return result;

      let value = result;
      for (let i = 2; i < path.length; i++) {
        if (value === undefined) return undefined;
        value = value[path[i]];
      }
      return value;
    }

    return undefined;
  }
}
```

### 4. MCP API Layer

The MCP API Layer exposes MCP capabilities to the client:

```typescript
// src/app/api/mcp/servers/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { McpServerManager } from "@/lib/mcp/server-manager";

// Initialize server manager
const serverManager = new McpServerManager("/path/to/config/dir");

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all servers
    const servers = serverManager.getAllServers();

    return NextResponse.json(servers);
  } catch (error) {
    console.error("Error in MCP servers API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get server configuration from request
    const config = await req.json();

    // Register new server
    const serverId = await serverManager.registerServer(config);

    return NextResponse.json({ id: serverId });
  } catch (error) {
    console.error("Error in MCP servers API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

```typescript
// src/app/api/mcp/servers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { McpServerManager } from "@/lib/mcp/server-manager";

// Initialize server manager
const serverManager = new McpServerManager("/path/to/config/dir");

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get server status
    const status = serverManager.getServerStatus(params.id);

    return NextResponse.json(status);
  } catch (error) {
    console.error("Error in MCP server API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Remove server
    await serverManager.removeServer(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in MCP server API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

```typescript
// src/app/api/mcp/servers/[id]/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { McpServerManager } from "@/lib/mcp/server-manager";

// Initialize server manager
const serverManager = new McpServerManager("/path/to/config/dir");

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Start server
    const success = await serverManager.startServer(params.id);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Failed to start server" }, { status: 500 });
    }
  } catch (error) {
    console.error("Error in MCP server start API:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
```

Similar API routes would be implemented for stopping, restarting servers, and managing capabilities and workflows.

## Python MCP Server Templates

To facilitate the creation of MCP servers, we provide Python templates for different types of MCP servers:

### 1. Tool Server Template

```python
# templates/tool_server.py
import asyncio
import json
import os
import sys
from typing import Dict, Any, List, Optional

from mcp_agent.core.fastagent import FastAgent

# Create the application
fast = FastAgent("Tool Server")

# Define tool specifications
tools = [
    {
        "name": "example_tool",
        "description": "An example tool that demonstrates MCP capabilities",
        "parameters": {
            "type": "object",
            "properties": {
                "input": {
                    "type": "string",
                    "description": "Input text to process"
                }
            },
            "required": ["input"]
        },
        "returns": {
            "type": "object",
            "properties": {
                "result": {
                    "type": "string",
                    "description": "Processed result"
                }
            }
        }
    }
]

# Tool implementation
async def example_tool(params: Dict[str, Any]) -> Dict[str, Any]:
    input_text = params.get("input", "")
    # Process the input (example: reverse the text)
    result = input_text[::-1]
    return {"result": result}

# Map tool names to their implementations
tool_implementations = {
    "example_tool": example_tool
}

@fast.agent(
    "tool_server",
    "A server that provides MCP tools",
    servers=[]  # No external servers needed
)
async def main():
    # Register tools with the MCP server
    for tool in tools:
        # Register the tool specification
        # In a real implementation, this would use the MCP SDK
        print(f"Registered tool: {tool['name']}")

    async with fast.run() as agent:
        await agent.interactive()

        # In a real implementation, this would handle tool invocation requests
        # and call the appropriate tool implementation

if __name__ == "__main__":
    asyncio.run(main())
```

### 2. Resource Server Template

```python
# templates/resource_server.py
import asyncio
import json
import os
import sys
from typing import Dict, Any, List, Optional

from mcp_agent.core.fastagent import FastAgent

# Create the application
fast = FastAgent("Resource Server")

# Define resource specifications
resources = [
    {
        "name": "example_resource",
        "description": "An example resource that provides data",
        "schema": {
            "type": "object",
            "properties": {
                "id": {
                    "type": "string",
                    "description": "Unique identifier"
                },
                "name": {
                    "type": "string",
                    "description": "Resource name"
                },
                "data": {
                    "type": "string",
                    "description": "Resource data"
                }
            }
        }
    }
]

# Sample data for the resource
resource_data = [
    {"id": "1", "name": "Item 1", "data": "Sample data 1"},
    {"id": "2", "name": "Item 2", "data": "Sample data 2"},
    {"id": "3", "name": "Item 3", "data": "Sample data 3"}
]

# Resource implementation
async def query_example_resource(query: Dict[str, Any]) -> List[Dict[str, Any]]:
    # Simple query implementation (example: filter by id)
    if "id" in query:
        return [item for item in resource_data if item["id"] == query["id"]]

    # Return all data if no filter
    return resource_data

# Map resource names to their query implementations
resource_implementations = {
    "example_resource": query_example_resource
}

@fast.agent(
    "resource_server",
    "A server that provides MCP resources",
    servers=[]  # No external servers needed
)
async def main():
    # Register resources with the MCP server
    for resource in resources:
        # Register the resource specification
        # In a real implementation, this would use the MCP SDK
        print(f"Registered resource: {resource['name']}")

    async with fast.run() as agent:
        await agent.interactive()

        # In a real implementation, this would handle resource query requests
        # and call the appropriate resource implementation

if __name__ == "__main__":
    asyncio.run(main())
```

### 3. Prompt Server Template

```python
# templates/prompt_server.py
import asyncio
import json
import os
import sys
from typing import Dict, Any, List, Optional

from mcp_agent.core.fastagent import FastAgent

# Create the application
fast = FastAgent("Prompt Server")

# Define prompt specifications
prompts = [
    {
        "name": "example_prompt",
        "description": "An example prompt template",
        "variables": ["name", "topic"],
        "content": "Hello {name}, here's information about {topic}: "
    }
]

# Prompt implementation
async def render_example_prompt(variables: Dict[str, str]) -> str:
    prompt = prompts[0]["content"]
    for var_name, var_value in variables.items():
        prompt = prompt.replace(f"{{{var_name}}}", var_value)
    return prompt

# Map prompt names to their implementations
prompt_implementations = {
    "example_prompt": render_example_prompt
}

@fast.agent(
    "prompt_server",
    "A server that provides MCP prompts",
    servers=[]  # No external servers needed
)
async def main():
    # Register prompts with the MCP server
    for prompt in prompts:
        # Register the prompt specification
        # In a real implementation, this would use the MCP SDK
        print(f"Registered prompt: {prompt['name']}")

    async with fast.run() as agent:
        await agent.interactive()

        # In a real implementation, this would handle prompt rendering requests
        # and call the appropriate prompt implementation

if __name__ == "__main__":
    asyncio.run(main())
```

## Integration with Fast-Agent Bridge

The server-side MCP capabilities integrate with the Fast-Agent bridge through the following mechanisms:

1. **Configuration Management**: The MCP server manager provides configurations to the Fast-Agent bridge
2. **Capability Discovery**: The MCP capability registry informs the Fast-Agent bridge about available tools, resources, and prompts
3. **Workflow Execution**: The MCP orchestration engine coordinates with the Fast-Agent bridge to execute workflows

```typescript
// src/lib/mcp/integration.ts
import { FastAgentBridge, FastAgentConfig } from "../fast-agent";
import { McpServerManager } from "./server-manager";
import { McpCapabilityRegistry } from "./capability-registry";
import { McpOrchestrationEngine } from "./orchestration-engine";

export class McpIntegration {
  private serverManager: McpServerManager;
  private registry: McpCapabilityRegistry;
  private orchestrationEngine: McpOrchestrationEngine;

  constructor(
    serverManager: McpServerManager,
    registry: McpCapabilityRegistry,
    orchestrationEngine: McpOrchestrationEngine
  ) {
    this.serverManager = serverManager;
    this.registry = registry;
    this.orchestrationEngine = orchestrationEngine;
  }

  async createAgentWithCapabilities(
    instruction: string,
    capabilities: Array<{
      type: "tool" | "resource" | "prompt";
      id: string;
    }>
  ): Promise<FastAgentBridge> {
    // Collect server IDs for the requested capabilities
    const serverIds = new Set<string>();

    for (const capability of capabilities) {
      let serverId: string | undefined;

      switch (capability.type) {
        case "tool":
          serverId = this.registry.getTool(capability.id)?.serverId;
          break;
        case "resource":
          serverId = this.registry.getResource(capability.id)?.serverId;
          break;
        case "prompt":
          serverId = this.registry.getPrompt(capability.id)?.serverId;
          break;
      }

      if (serverId) {
        serverIds.add(serverId);
      }
    }

    // Ensure all required servers are running
    for (const serverId of serverIds) {
      const status = this.serverManager.getServerStatus(serverId);
      if (status.status !== "running") {
        await this.serverManager.startServer(serverId);
      }
    }

    // Create Fast-Agent bridge with the required servers
    const agentConfig: FastAgentConfig = {
      model: "gpt-4o",
      instruction,
      servers: Array.from(serverIds),
      humanInput: true,
    };

    const agent = new FastAgentBridge(agentConfig);
    await agent.initialize();

    return agent;
  }

  async executeWorkflowWithAgent(
    workflowId: string,
    initialVariables: Record<string, any> = {}
  ): Promise<any> {
    // Execute the workflow
    const executionId = await this.orchestrationEngine.executeWorkflow(
      workflowId,
      initialVariables
    );

    // Wait for execution to complete
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const execution = this.orchestrationEngine.getExecution(executionId);

        if (!execution) {
          clearInterval(checkInterval);
          reject(new Error(`Execution ${executionId} not found`));
          return;
        }

        if (execution.status === "completed") {
          clearInterval(checkInterval);
          resolve(execution.results);
          return;
        }

        if (execution.status === "failed") {
          clearInterval(checkInterval);
          reject(new Error(execution.error || "Workflow execution failed"));
          return;
        }
      }, 1000);
    });
  }
}
```

## Client-Side Integration

The client-side components integrate with the server-side MCP capabilities through the following UI components:

### 1. MCP Server Management UI

```tsx
// src/components/mcp/server-management.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Play, Square, RefreshCw, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ServerInfo {
  id: string;
  name: string;
  type: "tool" | "resource" | "prompt";
  status: "stopped" | "starting" | "running" | "error";
  lastError?: string;
}

export function McpServerManagement() {
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newServerOpen, setNewServerOpen] = useState(false);
  const [newServer, setNewServer] = useState({
    name: "",
    type: "tool" as const,
    command: "",
    args: "",
    workingDir: "",
    autoStart: true,
  });

  // Fetch servers on component mount
  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/mcp/servers");
      if (!response.ok) throw new Error("Failed to fetch servers");

      const data = await response.json();
      setServers(data);
    } catch (error) {
      console.error("Error fetching servers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartServer = async (id: string) => {
    try {
      const response = await fetch(`/api/mcp/servers/${id}/start`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to start server");

      // Update server status
      fetchServers();
    } catch (error) {
      console.error("Error starting server:", error);
    }
  };

  const handleStopServer = async (id: string) => {
    try {
      const response = await fetch(`/api/mcp/servers/${id}/stop`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to stop server");

      // Update server status
      fetchServers();
    } catch (error) {
      console.error("Error stopping server:", error);
    }
  };

  const handleRestartServer = async (id: string) => {
    try {
      const response = await fetch(`/api/mcp/servers/${id}/restart`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to restart server");

      // Update server status
      fetchServers();
    } catch (error) {
      console.error("Error restarting server:", error);
    }
  };

  const handleDeleteServer = async (id: string) => {
    try {
      const response = await fetch(`/api/mcp/servers/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete server");

      // Update server list
      fetchServers();
    } catch (error) {
      console.error("Error deleting server:", error);
    }
  };

  const handleCreateServer = async () => {
    try {
      const response = await fetch("/api/mcp/servers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newServer.name,
          type: newServer.type,
          command: newServer.command,
          args: newServer.args.split(" ").filter(Boolean),
          workingDir: newServer.workingDir || undefined,
          autoStart: newServer.autoStart,
        }),
      });

      if (!response.ok) throw new Error("Failed to create server");

      // Reset form and close dialog
      setNewServer({
        name: "",
        type: "tool",
        command: "",
        args: "",
        workingDir: "",
        autoStart: true,
      });
      setNewServerOpen(false);

      // Update server list
      fetchServers();
    } catch (error) {
      console.error("Error creating server:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "bg-green-500";
      case "starting":
        return "bg-yellow-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">MCP Servers</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchServers} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={newServerOpen} onOpenChange={setNewServerOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Server
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New MCP Server</DialogTitle>
                <DialogDescription>
                  Configure a new MCP server to provide tools, resources, or prompts.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={newServer.name}
                    onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Type
                  </Label>
                  <Select
                    value={newServer.type}
                    onValueChange={(value: "tool" | "resource" | "prompt") =>
                      setNewServer({ ...newServer, type: value })
                    }
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select server type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tool">Tool Server</SelectItem>
                      <SelectItem value="resource">Resource Server</SelectItem>
                      <SelectItem value="prompt">Prompt Server</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="command" className="text-right">
                    Command
                  </Label>
                  <Input
                    id="command"
                    value={newServer.command}
                    onChange={(e) => setNewServer({ ...newServer, command: e.target.value })}
                    className="col-span-3"
                    placeholder="python3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="args" className="text-right">
                    Arguments
                  </Label>
                  <Input
                    id="args"
                    value={newServer.args}
                    onChange={(e) => setNewServer({ ...newServer, args: e.target.value })}
                    className="col-span-3"
                    placeholder="-m server.py --port 8080"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="workingDir" className="text-right">
                    Working Directory
                  </Label>
                  <Input
                    id="workingDir"
                    value={newServer.workingDir}
                    onChange={(e) => setNewServer({ ...newServer, workingDir: e.target.value })}
                    className="col-span-3"
                    placeholder="/path/to/server"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="autoStart" className="text-right">
                    Auto Start
                  </Label>
                  <div className="col-span-3 flex items-center">
                    <input
                      type="checkbox"
                      id="autoStart"
                      checked={newServer.autoStart}
                      onChange={(e) => setNewServer({ ...newServer, autoStart: e.target.checked })}
                      className="mr-2"
                    />
                    <Label htmlFor="autoStart">Start server automatically</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewServerOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateServer}>Create Server</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {servers.length === 0 ? (
            <div className="col-span-full rounded-lg border p-8 text-center">
              <p className="text-gray-500">No MCP servers configured</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setNewServerOpen(true)}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Server
              </Button>
            </div>
          ) : (
            servers.map((server) => (
              <Card key={server.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{server.name}</CardTitle>
                      <CardDescription>Type: {server.type}</CardDescription>
                    </div>
                    <Badge className={getStatusColor(server.status)}>{server.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">ID: {server.id}</p>
                  {server.lastError && (
                    <p className="mt-2 text-sm text-red-500">Error: {server.lastError}</p>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <div className="flex gap-2">
                    {server.status === "stopped" || server.status === "error" ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStartServer(server.id)}
                      >
                        <Play className="mr-1 h-4 w-4" />
                        Start
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStopServer(server.id)}
                      >
                        <Square className="mr-1 h-4 w-4" />
                        Stop
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRestartServer(server.id)}
                      disabled={server.status === "stopped"}
                    >
                      <RefreshCw className="mr-1 h-4 w-4" />
                      Restart
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteServer(server.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
```

### 2. MCP Capability Explorer

```tsx
// src/components/mcp/capability-explorer.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wrench, Database, FileText, ExternalLink } from "lucide-react";

interface McpTool {
  id: string;
  name: string;
  description: string;
  serverId: string;
  parameters: Record<string, any>;
  returnType: Record<string, any>;
}

interface McpResource {
  id: string;
  name: string;
  description: string;
  serverId: string;
  schema: Record<string, any>;
}

interface McpPrompt {
  id: string;
  name: string;
  description: string;
  serverId: string;
  content: string;
  variables: string[];
}

export function McpCapabilityExplorer() {
  const [tools, setTools] = useState<McpTool[]>([]);
  const [resources, setResources] = useState<McpResource[]>([]);
  const [prompts, setPrompts] = useState<McpPrompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCapabilities();
  }, []);

  const fetchCapabilities = async () => {
    try {
      setLoading(true);

      // Fetch tools
      const toolsResponse = await fetch("/api/mcp/capabilities/tools");
      if (!toolsResponse.ok) throw new Error("Failed to fetch tools");
      const toolsData = await toolsResponse.json();
      setTools(toolsData);

      // Fetch resources
      const resourcesResponse = await fetch("/api/mcp/capabilities/resources");
      if (!resourcesResponse.ok) throw new Error("Failed to fetch resources");
      const resourcesData = await resourcesResponse.json();
      setResources(resourcesData);

      // Fetch prompts
      const promptsResponse = await fetch("/api/mcp/capabilities/prompts");
      if (!promptsResponse.ok) throw new Error("Failed to fetch prompts");
      const promptsData = await promptsResponse.json();
      setPrompts(promptsData);
    } catch (error) {
      console.error("Error fetching capabilities:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">MCP Capabilities</h2>
        <Button variant="outline" size="sm" onClick={fetchCapabilities} disabled={loading}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <Tabs defaultValue="tools">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tools">
              <Wrench className="mr-2 h-4 w-4" />
              Tools ({tools.length})
            </TabsTrigger>
            <TabsTrigger value="resources">
              <Database className="mr-2 h-4 w-4" />
              Resources ({resources.length})
            </TabsTrigger>
            <TabsTrigger value="prompts">
              <FileText className="mr-2 h-4 w-4" />
              Prompts ({prompts.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tools" className="mt-4">
            {tools.length === 0 ? (
              <div className="rounded-lg border p-8 text-center">
                <p className="text-gray-500">No tools available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {tools.map((tool) => (
                  <Card key={tool.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="flex items-center">
                          <Wrench className="mr-2 h-4 w-4" />
                          {tool.name}
                        </CardTitle>
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={`/mcp/tools/${tool.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                      <CardDescription>{tool.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <h4 className="text-sm font-semibold">Parameters:</h4>
                          <pre className="mt-1 max-h-24 overflow-auto rounded bg-gray-100 p-2 text-xs">
                            {JSON.stringify(tool.parameters, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold">Return Type:</h4>
                          <pre className="mt-1 max-h-24 overflow-auto rounded bg-gray-100 p-2 text-xs">
                            {JSON.stringify(tool.returnType, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Badge variant="outline">Server: {tool.serverId}</Badge>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="resources" className="mt-4">
            {resources.length === 0 ? (
              <div className="rounded-lg border p-8 text-center">
                <p className="text-gray-500">No resources available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {resources.map((resource) => (
                  <Card key={resource.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="flex items-center">
                          <Database className="mr-2 h-4 w-4" />
                          {resource.name}
                        </CardTitle>
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={`/mcp/resources/${resource.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                      <CardDescription>{resource.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <h4 className="text-sm font-semibold">Schema:</h4>
                        <pre className="mt-1 max-h-48 overflow-auto rounded bg-gray-100 p-2 text-xs">
                          {JSON.stringify(resource.schema, null, 2)}
                        </pre>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Badge variant="outline">Server: {resource.serverId}</Badge>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="prompts" className="mt-4">
            {prompts.length === 0 ? (
              <div className="rounded-lg border p-8 text-center">
                <p className="text-gray-500">No prompts available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {prompts.map((prompt) => (
                  <Card key={prompt.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="flex items-center">
                          <FileText className="mr-2 h-4 w-4" />
                          {prompt.name}
                        </CardTitle>
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={`/mcp/prompts/${prompt.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                      <CardDescription>{prompt.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <h4 className="text-sm font-semibold">Variables:</h4>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {prompt.variables.map((variable) => (
                              <Badge key={variable} variant="secondary">
                                {variable}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold">Content:</h4>
                          <div className="mt-1 max-h-48 overflow-auto rounded bg-gray-100 p-2 text-sm">
                            {prompt.content}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Badge variant="outline">Server: {prompt.serverId}</Badge>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
```

## Conclusion

This implementation provides a comprehensive server-side MCP capabilities integration for the Next.js PWA. The key features include:

1. **MCP Server Management**: Start, stop, and monitor MCP servers
2. **Capability Registry**: Track and manage tools, resources, and prompts
3. **Orchestration Engine**: Coordinate workflows across multiple MCP servers
4. **Fast-Agent Integration**: Seamless integration with the Fast-Agent bridge
5. **Client-Side UI**: User interfaces for managing MCP capabilities

The implementation follows the principle that MCP capabilities should be hosted on the server rather than the client, providing a more secure and scalable architecture. The modular design allows for easy extension and customization, while the UI components provide a user-friendly interface for managing MCP capabilities.

The next step is to implement UI-based orchestration management, which will build upon this foundation to provide a visual interface for creating and managing workflows across multiple MCP servers.
