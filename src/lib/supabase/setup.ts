"use client";

import { createSupabaseClient } from "./client";
import { initDatabase, seedDatabase } from "./init-database";

// Mock data for development
const mockMcpConfigs = [
  {
    id: "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
    name: "Claude AI Server",
    description: "Anthropic Claude API server",
    url: "https://api.anthropic.com/v1",
    apiKey: "sk_ant_mock123456789",
    capabilities: [
      { id: "cap1", name: "Claude Chat", type: "model", description: "Claude chat completion" },
      { id: "cap2", name: "File Upload", type: "tool", description: "Upload files to Claude" }
    ]
  },
  {
    id: "2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q",
    name: "OpenAI Server",
    description: "OpenAI API server",
    url: "https://api.openai.com/v1",
    apiKey: "sk-mock123456789",
    capabilities: [
      { id: "cap3", name: "GPT-4", type: "model", description: "GPT-4 language model" },
      { id: "cap4", name: "DALL-E", type: "tool", description: "Image generation" }
    ]
  }
];

const mockChatSessions = [
  {
    id: "chat1",
    title: "Project Planning",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    messages: JSON.stringify([
      { role: "user", content: "Let's plan our new project architecture" },
      { role: "assistant", content: "I'd recommend a microservices approach with..." }
    ])
  },
  {
    id: "chat2",
    title: "API Documentation",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    messages: JSON.stringify([
      { role: "user", content: "Help me document my REST API" },
      { role: "assistant", content: "Here's a template for REST API documentation..." }
    ])
  }
];

/**
 * Sets up the basic required database tables for Nexus if they don't exist.
 * This is mostly for development/demo purposes.
 */
export async function setupBasicDatabaseTables() {
  const supabase = createSupabaseClient();
  
  console.log("Checking and setting up basic database tables...");

  try {
    // Check if profiles table exists
    const { error: profilesError } = await supabase.from("profiles").select("id").limit(1);
    
    if (profilesError && profilesError.message.includes("does not exist")) {
      console.log("Missing profiles table - attempting to create required tables");
      
      // Initialize database tables
      const initSuccess = await initDatabase();
      
      if (initSuccess) {
        console.log("Successfully created database tables");
        
        // Seed with sample data
        const seedSuccess = await seedDatabase();
        if (seedSuccess) {
          console.log("Successfully seeded database with sample data");
        }
      } else {
        console.error("Failed to initialize database tables");
      }
    } else {
      // Check if mcp_configs table exists
      const { error: mcpConfigError } = await supabase.from("mcp_configs").select("id").limit(1);
      
      // If mcp_configs doesn't exist but profiles does, we need to create the remaining tables
      if (mcpConfigError && mcpConfigError.message.includes("does not exist")) {
        console.log("Missing mcp_configs table - attempting to create required tables");
        await initDatabase();
      }
    }

    console.log("Database setup complete.");
  } catch (error) {
    console.error("Error setting up database tables:", error);
  }
}

/**
 * Get mock MCP configs for development
 */
export function getMockMcpConfigs() {
  return mockMcpConfigs;
}

/**
 * Get mock chat sessions for development
 */
export function getMockChatSessions() {
  return mockChatSessions;
}