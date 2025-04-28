import type { MCPCapability } from './capability';

/**
 * Interface for model capabilities
 */
export interface MCPModel extends MCPCapability {
  type: 'model';
  provider: string;
  name: string;
  contextWindow: number;
  apiConfig: {
    apiKey?: string;
    orgId?: string;
    endpoint?: string;
    headers?: Record<string, string>;
  };
  supportedFeatures: Array<
    | 'chat'
    | 'completion'
    | 'function_calling'
    | 'vision'
    | 'embedding'
    | 'rag'
    | 'streaming'
  >;
  maxOutputTokens: number;
  supportedModalities: Array<'text' | 'image' | 'audio' | 'video'>;
  defaultParameters?: {
    temperature?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stopSequences?: string[];
  };
}

/**
 * Request parameters for model execution
 */
export interface ModelExecutionRequest {
  modelId: string;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  stream?: boolean;
  images?: Array<{
    url?: string;
    base64Data?: string;
    mimeType?: string;
  }>;
  parameters?: Record<string, any>;
}

/**
 * Response from model execution
 */
export interface ModelExecutionResult {
  success: boolean;
  completion?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  executionTime?: number;
}

/**
 * Token from streaming model execution
 */
export interface ModelStreamToken {
  token: string;
  isDone: boolean;
}
