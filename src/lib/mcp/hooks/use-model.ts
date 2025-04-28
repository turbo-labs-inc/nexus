"use client";

import { useState, useCallback, useEffect } from 'react';
import { ModelManager } from '../server/model-manager';
import { MCPModel, ModelExecutionRequest, ModelExecutionResult } from '../types';
import { getMCPServerManager } from '../server/manager';

/**
 * React hook for using the model manager
 */
export function useModel() {
  const [modelManager] = useState(() => new ModelManager(getMCPServerManager()));
  const [models, setModels] = useState<MCPModel[]>(modelManager.getModels());
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [currentModelId, setCurrentModelId] = useState<string | null>(null);

  // Update models when capabilities change
  useEffect(() => {
    const serverManager = getMCPServerManager();
    
    const handleEvent = (event: any) => {
      if (event.type === 'capabilities_update') {
        setModels(modelManager.getModels());
      }
    };

    serverManager.addEventListener(handleEvent);
    return () => {
      serverManager.removeEventListener(handleEvent);
    };
  }, [modelManager]);

  /**
   * Execute a model with the given request
   */
  const executeModel = useCallback(
    async (request: ModelExecutionRequest): Promise<ModelExecutionResult> => {
      try {
        setIsExecuting(true);
        setCurrentModelId(request.modelId);
        return await modelManager.executeModel(request);
      } finally {
        setIsExecuting(false);
        setCurrentModelId(null);
      }
    },
    [modelManager]
  );

  /**
   * Execute a simple prompt against a model
   */
  const executePrompt = useCallback(
    async (
      modelId: string, 
      prompt: string, 
      options?: Omit<ModelExecutionRequest, 'modelId' | 'prompt'>
    ): Promise<string> => {
      try {
        setIsExecuting(true);
        setCurrentModelId(modelId);
        
        const result = await modelManager.executeModel({
          modelId,
          prompt,
          ...options,
        });
        
        if (!result.success || !result.completion) {
          throw new Error(result.error?.message || 'Model execution failed');
        }
        
        return result.completion;
      } finally {
        setIsExecuting(false);
        setCurrentModelId(null);
      }
    },
    [modelManager]
  );

  return {
    models,
    isExecuting,
    currentModelId,
    executeModel,
    executePrompt,
    getModel: useCallback((id: string) => modelManager.getModel(id), [modelManager]),
    getModelsByProvider: useCallback(
      (provider: string) => modelManager.getModelsByProvider(provider),
      [modelManager]
    ),
  };
}