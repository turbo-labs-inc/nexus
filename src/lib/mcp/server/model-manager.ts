import { v4 as uuidv4 } from 'uuid';
import type { MCPModel, ModelExecutionRequest, ModelExecutionResult, ModelStreamToken } from '../types';
import { MCPServerManager } from './manager';

/**
 * Manages model executions through MCP servers
 */
export class ModelManager {
  private serverManager: MCPServerManager;
  private streamCallbacks: Map<string, (token: ModelStreamToken) => void>;

  constructor(serverManager: MCPServerManager) {
    this.serverManager = serverManager;
    this.streamCallbacks = new Map();

    // Set up listener for streaming tokens
    this.serverManager.addEventListener((event) => {
      if (event.type === 'model_stream_token') {
        const callback = this.streamCallbacks.get(event.requestId);
        if (callback) {
          callback(event.token);
          
          // Clean up when stream is done
          if (event.token.isDone) {
            this.streamCallbacks.delete(event.requestId);
          }
        }
      }
    });
  }

  /**
   * Get all registered models
   */
  getModels(): MCPModel[] {
    return Array.from(this.serverManager.getAllCapabilities())
      .filter((capability): capability is MCPModel => capability.type === 'model');
  }

  /**
   * Get a specific model by ID
   */
  getModel(modelId: string): MCPModel | undefined {
    return this.getModels().find(model => model.id === modelId);
  }

  /**
   * Get models by provider
   */
  getModelsByProvider(provider: string): MCPModel[] {
    return this.getModels().filter(model => model.provider === provider);
  }

  /**
   * Execute a model with the given request
   */
  async executeModel(request: ModelExecutionRequest): Promise<ModelExecutionResult> {
    const model = this.getModel(request.modelId);
    if (!model) {
      return {
        success: false,
        error: {
          code: 'model_not_found',
          message: `Model with ID ${request.modelId} not found`,
        },
      };
    }

    const server = this.serverManager.getServer(model.serverId);
    if (!server) {
      return {
        success: false,
        error: {
          code: 'server_not_found',
          message: `Server with ID ${model.serverId} not found`,
        },
      };
    }

    const requestId = uuidv4();
    const startTime = Date.now();

    try {
      // If streaming is requested, set up callback
      if (request.stream) {
        return new Promise<ModelExecutionResult>((resolve) => {
          const tokens: string[] = [];
          
          this.streamCallbacks.set(requestId, (token) => {
            tokens.push(token.token);
            
            if (token.isDone) {
              resolve({
                success: true,
                completion: tokens.join(''),
                executionTime: Date.now() - startTime,
              });
            }
          });

          // Send the execution request
          this.serverManager.executeTool({
            type: 'model_execution',
            modelId: request.modelId,
            request,
          }, requestId);
        });
      }

      // For non-streaming requests
      const result = await this.serverManager.executeTool<ModelExecutionResult>(
        'model_execution',
        {
          modelId: request.modelId,
          request,
        }
      );

      return result || {
        success: false,
        error: {
          code: 'execution_failed',
          message: 'Model execution failed',
        },
      };
    } catch (error) {
      console.error('Error executing model:', error);
      return {
        success: false,
        error: {
          code: 'execution_error',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          details: error,
        },
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Register a new model with the given server
   */
  async registerModel(model: Omit<MCPModel, 'id' | 'serverId'>): Promise<MCPModel> {
    // Implementation would depend on how your server handles registration
    // This is a placeholder implementation
    throw new Error('Not implemented');
  }
}