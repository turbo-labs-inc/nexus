import { v4 as uuidv4 } from 'uuid';
import type { MCPComponent, ComponentRenderRequest, ComponentRenderResult } from '../types';
import { MCPServerManager } from './manager';

/**
 * Manages component rendering through MCP servers
 */
export class ComponentManager {
  private serverManager: MCPServerManager;

  constructor(serverManager: MCPServerManager) {
    this.serverManager = serverManager;
  }

  /**
   * Get all registered components
   */
  getComponents(): MCPComponent[] {
    return Array.from(this.serverManager.getAllCapabilities())
      .filter((capability): capability is MCPComponent => capability.type === 'component');
  }

  /**
   * Get a specific component by ID
   */
  getComponent(componentId: string): MCPComponent | undefined {
    return this.getComponents().find(component => component.id === componentId);
  }

  /**
   * Get components by type
   */
  getComponentsByType(componentType: string): MCPComponent[] {
    return this.getComponents().filter(component => component.componentType === componentType);
  }

  /**
   * Get components by category
   */
  getComponentsByCategory(category: string): MCPComponent[] {
    return this.getComponents().filter(component => component.category === category);
  }

  /**
   * Render a component with the given props
   */
  async renderComponent(request: ComponentRenderRequest): Promise<ComponentRenderResult> {
    const component = this.getComponent(request.componentId);
    if (!component) {
      return {
        success: false,
        error: {
          code: 'component_not_found',
          message: `Component with ID ${request.componentId} not found`,
        },
      };
    }

    const server = this.serverManager.getServer(component.serverId);
    if (!server) {
      return {
        success: false,
        error: {
          code: 'server_not_found',
          message: `Server with ID ${component.serverId} not found`,
        },
      };
    }

    const requestId = uuidv4();

    try {
      const result = await this.serverManager.executeTool<ComponentRenderResult>(
        'component_render',
        {
          componentId: request.componentId,
          props: request.props,
        }
      );

      return result || {
        success: false,
        error: {
          code: 'render_failed',
          message: 'Component rendering failed',
        },
      };
    } catch (error) {
      console.error('Error rendering component:', error);
      return {
        success: false,
        error: {
          code: 'render_error',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error,
        },
      };
    }
  }

  /**
   * Register a new component
   */
  async registerComponent(component: Omit<MCPComponent, 'id' | 'serverId'>): Promise<MCPComponent> {
    // Implementation would depend on how your server handles registration
    // This is a placeholder implementation
    throw new Error('Not implemented');
  }
}