"use server";

import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { type MCPSlackIntegration, type SlackMessageRequest, type SlackMessageResult } from "../types";
import { encryptValue, decryptValue } from "@/lib/utils/crypto";

/**
 * Get all Slack integrations from database
 */
export async function getSlackIntegrations(): Promise<MCPSlackIntegration[]> {
  try {
    const supabase = createClient(cookies());
    
    const { data, error } = await supabase
      .from("slack_integrations")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    
    // Decrypt sensitive data
    return data.map(integration => ({
      ...integration,
      apiConfig: {
        ...integration.apiConfig,
        botToken: integration.apiConfig.botToken ? decryptValue(integration.apiConfig.botToken) : undefined,
        signingSecret: integration.apiConfig.signingSecret ? decryptValue(integration.apiConfig.signingSecret) : undefined,
        clientSecret: integration.apiConfig.clientSecret ? decryptValue(integration.apiConfig.clientSecret) : undefined
      }
    }));
  } catch (error) {
    console.error("Error fetching Slack integrations:", error);
    return [];
  }
}

/**
 * Get a specific Slack integration by ID
 */
export async function getSlackIntegrationById(id: string): Promise<MCPSlackIntegration | null> {
  try {
    const supabase = createClient(cookies());
    
    const { data, error } = await supabase
      .from("slack_integrations")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error) throw error;
    if (!data) return null;
    
    // Decrypt sensitive data
    return {
      ...data,
      apiConfig: {
        ...data.apiConfig,
        botToken: data.apiConfig.botToken ? decryptValue(data.apiConfig.botToken) : undefined,
        signingSecret: data.apiConfig.signingSecret ? decryptValue(data.apiConfig.signingSecret) : undefined,
        clientSecret: data.apiConfig.clientSecret ? decryptValue(data.apiConfig.clientSecret) : undefined
      }
    };
  } catch (error) {
    console.error(`Error fetching Slack integration with ID ${id}:`, error);
    return null;
  }
}

/**
 * Create a new Slack integration
 */
export async function createSlackIntegration(
  integration: Omit<MCPSlackIntegration, "id" | "serverId" | "type" | "name" | "description" | "version" | "schema">
): Promise<MCPSlackIntegration> {
  try {
    const supabase = createClient(cookies());
    const newId = uuidv4();
    
    // Encrypt sensitive data
    const secureIntegration = {
      ...integration,
      apiConfig: {
        ...integration.apiConfig,
        botToken: integration.apiConfig.botToken ? encryptValue(integration.apiConfig.botToken) : undefined,
        signingSecret: integration.apiConfig.signingSecret ? encryptValue(integration.apiConfig.signingSecret) : undefined,
        clientSecret: integration.apiConfig.clientSecret ? encryptValue(integration.apiConfig.clientSecret) : undefined
      }
    };
    
    const { data, error } = await supabase
      .from("slack_integrations")
      .insert([
        {
          id: newId,
          type: "slack",
          name: `${integration.workspaceName} Slack`,
          description: `Slack integration for ${integration.workspaceName}`,
          version: "1.0.0",
          schema: {},
          serverId: "local", // For non-MCP server integrations, we use a placeholder
          ...secureIntegration,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single();
    
    if (error) throw error;
    
    // Decrypt sensitive data for return value
    const result = {
      ...data,
      apiConfig: {
        ...data.apiConfig,
        botToken: data.apiConfig.botToken ? decryptValue(data.apiConfig.botToken) : undefined,
        signingSecret: data.apiConfig.signingSecret ? decryptValue(data.apiConfig.signingSecret) : undefined,
        clientSecret: data.apiConfig.clientSecret ? decryptValue(data.apiConfig.clientSecret) : undefined
      }
    };
    
    revalidatePath("/slack");
    return result;
  } catch (error) {
    console.error("Error creating Slack integration:", error);
    throw new Error("Failed to create Slack integration");
  }
}

/**
 * Update an existing Slack integration
 */
export async function updateSlackIntegration(
  id: string, 
  integration: Partial<MCPSlackIntegration>
): Promise<MCPSlackIntegration> {
  try {
    const supabase = createClient(cookies());
    
    // Encrypt sensitive data if provided
    const secureIntegration: Partial<MCPSlackIntegration> = { ...integration };
    
    if (integration.apiConfig) {
      secureIntegration.apiConfig = {
        ...integration.apiConfig,
        botToken: integration.apiConfig.botToken ? encryptValue(integration.apiConfig.botToken) : undefined,
        signingSecret: integration.apiConfig.signingSecret ? encryptValue(integration.apiConfig.signingSecret) : undefined,
        clientSecret: integration.apiConfig.clientSecret ? encryptValue(integration.apiConfig.clientSecret) : undefined
      };
    }
    
    const { data, error } = await supabase
      .from("slack_integrations")
      .update({
        ...secureIntegration,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    
    // Decrypt sensitive data for return value
    const result = {
      ...data,
      apiConfig: {
        ...data.apiConfig,
        botToken: data.apiConfig.botToken ? decryptValue(data.apiConfig.botToken) : undefined,
        signingSecret: data.apiConfig.signingSecret ? decryptValue(data.apiConfig.signingSecret) : undefined,
        clientSecret: data.apiConfig.clientSecret ? decryptValue(data.apiConfig.clientSecret) : undefined
      }
    };
    
    revalidatePath("/slack");
    revalidatePath(`/slack/${id}`);
    return result;
  } catch (error) {
    console.error(`Error updating Slack integration with ID ${id}:`, error);
    throw new Error("Failed to update Slack integration");
  }
}

/**
 * Delete a Slack integration
 */
export async function deleteSlackIntegration(id: string): Promise<void> {
  try {
    const supabase = createClient(cookies());
    
    const { error } = await supabase
      .from("slack_integrations")
      .delete()
      .eq("id", id);
    
    if (error) throw error;
    
    revalidatePath("/slack");
  } catch (error) {
    console.error(`Error deleting Slack integration with ID ${id}:`, error);
    throw new Error("Failed to delete Slack integration");
  }
}

/**
 * Toggle Slack integration active status
 */
export async function toggleSlackIntegrationStatus(id: string, isActive: boolean): Promise<void> {
  try {
    const supabase = createClient(cookies());
    
    const { error } = await supabase
      .from("slack_integrations")
      .update({ isActive, updated_at: new Date().toISOString() })
      .eq("id", id);
    
    if (error) throw error;
    
    revalidatePath("/slack");
    revalidatePath(`/slack/${id}`);
  } catch (error) {
    console.error(`Error toggling Slack integration status with ID ${id}:`, error);
    throw new Error("Failed to update Slack integration status");
  }
}

/**
 * Send a message to Slack
 */
export async function sendSlackMessage(request: SlackMessageRequest): Promise<SlackMessageResult> {
  try {
    // This would use the Slack API to send a message
    // For now, just return a mock successful result
    return {
      success: true,
      ts: Date.now().toString(),
      channelId: request.channelId
    };
  } catch (error) {
    console.error("Error sending Slack message:", error);
    return {
      success: false,
      error: {
        code: "send_error",
        message: error instanceof Error ? error.message : "Unknown error occurred",
        details: error
      }
    };
  }
}