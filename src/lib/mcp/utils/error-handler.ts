"use client";

import { logger, LogLevel } from "./logger";

// Define common error types
export enum MCPErrorType {
  // Connection errors
  CONNECTION_FAILED = "connection_failed",
  CONNECTION_TIMEOUT = "connection_timeout",
  CONNECTION_CLOSED = "connection_closed",
  
  // Authentication errors
  AUTH_FAILED = "auth_failed",
  UNAUTHORIZED = "unauthorized",
  
  // Operation errors
  OPERATION_FAILED = "operation_failed",
  OPERATION_TIMEOUT = "operation_timeout",
  INVALID_PARAMETERS = "invalid_parameters",
  
  // Resource errors
  RESOURCE_NOT_FOUND = "resource_not_found",
  
  // Server errors
  SERVER_NOT_FOUND = "server_not_found",
  SERVER_OFFLINE = "server_offline",
  SERVER_ERROR = "server_error",
  
  // Capability errors
  CAPABILITY_NOT_FOUND = "capability_not_found",
  
  // Other errors
  VALIDATION_ERROR = "validation_error",
  INTERNAL_ERROR = "internal_error",
  UNKNOWN_ERROR = "unknown_error"
}

// Define MCP error structure
export interface MCPError {
  type: MCPErrorType;
  message: string;
  details?: any;
  serverId?: string;
  code?: string;
  timestamp: Date;
}

// Create an error object
export function createMCPError(
  type: MCPErrorType,
  message: string,
  details?: any,
  serverId?: string,
  code?: string
): MCPError {
  return {
    type,
    message,
    details,
    serverId,
    code,
    timestamp: new Date()
  };
}

// Log error and return error object
export function handleMCPError(
  type: MCPErrorType,
  message: string,
  details?: any,
  serverId?: string,
  code?: string,
  context?: string
): MCPError {
  // Create error object
  const error = createMCPError(type, message, details, serverId, code);
  
  // Log error
  logger.error(
    `MCP Error: ${type} - ${message}`,
    { details, code },
    serverId,
    context
  );
  
  return error;
}

// Convert an Error object to an MCPError
export function convertErrorToMCPError(
  error: Error,
  defaultType: MCPErrorType = MCPErrorType.UNKNOWN_ERROR,
  serverId?: string,
  context?: string
): MCPError {
  // Determine error type based on message
  let type = defaultType;
  
  if (error.message.includes("timeout")) {
    type = MCPErrorType.OPERATION_TIMEOUT;
  } else if (error.message.includes("connection")) {
    type = MCPErrorType.CONNECTION_FAILED;
  } else if (error.message.includes("auth") || error.message.includes("unauthorized")) {
    type = MCPErrorType.AUTH_FAILED;
  } else if (error.message.includes("not found")) {
    if (error.message.includes("server")) {
      type = MCPErrorType.SERVER_NOT_FOUND;
    } else if (error.message.includes("resource")) {
      type = MCPErrorType.RESOURCE_NOT_FOUND;
    } else if (error.message.includes("capability") || 
               error.message.includes("tool") ||
               error.message.includes("prompt")) {
      type = MCPErrorType.CAPABILITY_NOT_FOUND;
    }
  } else if (error.message.includes("offline")) {
    type = MCPErrorType.SERVER_OFFLINE;
  } else if (error.message.includes("invalid") || error.message.includes("parameter")) {
    type = MCPErrorType.INVALID_PARAMETERS;
  }
  
  // Create MCP error
  return handleMCPError(
    type,
    error.message,
    { stack: error.stack },
    serverId,
    "error",
    context
  );
}

// Check if error is of a specific type
export function isMCPErrorType(error: MCPError, type: MCPErrorType): boolean {
  return error.type === type;
}

// Format error message for client response
export function formatMCPErrorResponse(error: MCPError): { 
  error: {
    code: string;
    type: string;
    message: string;
    details?: any;
  }
} {
  return {
    error: {
      code: error.code || error.type,
      type: error.type,
      message: error.message,
      details: error.details
    }
  };
}

// Error handler for try/catch blocks
export async function withMCPErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string,
  serverId?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    const mcpError = convertErrorToMCPError(
      error instanceof Error ? error : new Error(String(error)),
      MCPErrorType.OPERATION_FAILED,
      serverId,
      context
    );
    
    throw mcpError;
  }
}