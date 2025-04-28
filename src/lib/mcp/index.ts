/**
 * MCP (Model Context Protocol) module
 * 
 * This module provides functionality for interacting with MCP servers, including:
 * - Server management
 * - Tool execution
 * - Resource querying
 * - Prompt rendering
 * - Model execution
 * - Slack integration
 * - Component rendering
 * - Capability management
 * - Utilities for logging, error handling, and metrics
 */

// Export types
export * from "./types";

// Export server-side components
export * from "./server/manager";
export * from "./server/client";
export * from "./server/ws-client";
export * from "./server/model-manager";
export * from "./server/slack-manager";
export * from "./server/component-manager";

// Export hooks
export * from "./hooks/use-server-status";

// Export utilities
export * from "./utils";