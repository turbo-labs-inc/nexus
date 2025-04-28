"use server";

import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { type MCPModel, type ModelExecutionRequest, type ModelExecutionResult } from "../types";
import { encryptValue, decryptValue } from "@/lib/utils/crypto";

/**
 * Get all model configurations from database
 */
export async function getModels(): Promise<MCPModel[]> {
  try {
    const supabase = createClient(cookies());
    
    const { data, error } = await supabase
      .from("model_configurations")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    
    // Decrypt API keys
    return data.map(model => ({
      ...model,
      apiConfig: {
        ...model.apiConfig,
        apiKey: model.apiConfig.apiKey ? decryptValue(model.apiConfig.apiKey) : undefined
      }
    }));
  } catch (error) {
    console.error("Error fetching models:", error);
    return [];
  }
}

/**
 * Get a specific model by ID
 */
export async function getModelById(id: string): Promise<MCPModel | null> {
  try {
    const supabase = createClient(cookies());
    
    const { data, error } = await supabase
      .from("model_configurations")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) throw error;
    if (!data) return null;
    
    // Decrypt API key
    return {
      ...data,
      apiConfig: {
        ...data.apiConfig,
        apiKey: data.apiConfig.apiKey ? decryptValue(data.apiConfig.apiKey) : undefined
      }
    };
  } catch (error) {
    console.error(`Error fetching model with ID ${id}:`, error);
    return null;
  }
}

/**
 * Create a new model configuration
 */
export async function createModel(model: Omit<MCPModel, "id" | "serverId">): Promise<MCPModel> {
  try {
    const supabase = createClient(cookies());
    const newId = uuidv4();
    
    // Encrypt API key if present
    const secureModel = {
      ...model,
      apiConfig: {
        ...model.apiConfig,
        apiKey: model.apiConfig.apiKey ? encryptValue(model.apiConfig.apiKey) : undefined
      }
    };
    
    const { data, error } = await supabase
      .from("model_configurations")
      .insert([
        {
          id: newId,
          ...secureModel,
          serverId: "local", // For non-MCP server models, we use a placeholder
          isActive: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();
    
    if (error) throw error;
    
    // Decrypt API key for return value
    const result = {
      ...data,
      apiConfig: {
        ...data.apiConfig,
        apiKey: data.apiConfig.apiKey ? decryptValue(data.apiConfig.apiKey) : undefined
      }
    };
    
    revalidatePath("/models");
    return result;
  } catch (error) {
    console.error("Error creating model:", error);
    throw new Error("Failed to create model configuration");
  }
}

/**
 * Update an existing model configuration
 */
export async function updateModel(id: string, model: Partial<MCPModel>): Promise<MCPModel> {
  try {
    const supabase = createClient(cookies());
    
    // If apiKey is provided, encrypt it
    const secureModel = model.apiConfig?.apiKey ? {
      ...model,
      apiConfig: {
        ...model.apiConfig,
        apiKey: encryptValue(model.apiConfig.apiKey)
      }
    } : model;
    
    const { data, error } = await supabase
      .from("model_configurations")
      .update({
        ...secureModel,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Decrypt API key for return value
    const result = {
      ...data,
      apiConfig: {
        ...data.apiConfig,
        apiKey: data.apiConfig.apiKey ? decryptValue(data.apiConfig.apiKey) : undefined
      }
    };
    
    revalidatePath("/models");
    revalidatePath(`/models/${id}`);
    return result;
  } catch (error) {
    console.error(`Error updating model with ID ${id}:`, error);
    throw new Error("Failed to update model configuration");
  }
}

/**
 * Delete a model configuration
 */
export async function deleteModel(id: string): Promise<void> {
  try {
    const supabase = createClient(cookies());
    
    const { error } = await supabase
      .from("model_configurations")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
    
    revalidatePath("/models");
  } catch (error) {
    console.error(`Error deleting model with ID ${id}:`, error);
    throw new Error("Failed to delete model configuration");
  }
}

/**
 * Set a model as the current default model
 */
export async function setCurrentModel(id: string): Promise<void> {
  try {
    const supabase = createClient(cookies());
    
    // First, unset any current default model
    await supabase
      .from("model_configurations")
      .update({ isDefault: false })
      .eq("isDefault", true);
    
    // Then set the new default
    const { error } = await supabase
      .from("model_configurations")
      .update({ isDefault: true })
      .eq("id", id);
    
    if (error) throw error;
    
    revalidatePath("/models");
  } catch (error) {
    console.error(`Error setting model ${id} as current:`, error);
    throw new Error("Failed to set current model");
  }
}

/**
 * Get the current default model
 */
export async function getCurrentModel(): Promise<MCPModel | null> {
  try {
    const supabase = createClient(cookies());
    
    const { data, error } = await supabase
      .from("model_configurations")
      .select("*")
      .eq("isDefault", true)
      .single();
    
    if (error) {
      // If no default model is set, get the most recently created one
      const { data: latestData, error: latestError } = await supabase
        .from("model_configurations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
      
      if (latestError) return null;
      
      // Decrypt API key
      return {
        ...latestData,
        apiConfig: {
          ...latestData.apiConfig,
          apiKey: latestData.apiConfig.apiKey ? decryptValue(latestData.apiConfig.apiKey) : undefined
        }
      };
    }
    
    // Decrypt API key
    return {
      ...data,
      apiConfig: {
        ...data.apiConfig,
        apiKey: data.apiConfig.apiKey ? decryptValue(data.apiConfig.apiKey) : undefined
      }
    };
  } catch (error) {
    console.error("Error fetching current model:", error);
    return null;
  }
}