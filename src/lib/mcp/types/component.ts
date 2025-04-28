import type { MCPCapability } from './capability';

/**
 * Interface for MCP component capabilities
 */
export interface MCPComponent extends MCPCapability {
  type: 'component';
  componentType: string;
  description: string;
  category: string;
  icon?: string;
  schema: ComponentSchema;
  defaultProps?: Record<string, any>;
  tags?: string[];
  author?: string;
  version?: string;
}

/**
 * Schema for component properties and configuration
 */
export interface ComponentSchema {
  properties: Record<string, PropertySchema>;
  required?: string[];
  uiSchema?: Record<string, any>;
}

/**
 * Schema for component property
 */
export interface PropertySchema {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  title: string;
  description?: string;
  default?: any;
  enum?: any[];
  enumNames?: string[];
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  items?: PropertySchema;
  properties?: Record<string, PropertySchema>;
  required?: string[];
}

/**
 * Request for rendering a component
 */
export interface ComponentRenderRequest {
  componentId: string;
  props: Record<string, any>;
}

/**
 * Response from component rendering
 */
export interface ComponentRenderResult {
  success: boolean;
  rendered?: {
    html?: string; 
    jsx?: string;
    props?: Record<string, any>;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
