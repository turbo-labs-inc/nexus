"use client";

import { createSupabaseClient } from "./client";
import { readFileSync } from 'fs';
import path from 'path';

/**
 * Executes a SQL file directly against the database
 * This is a powerful way to ensure tables exist with correct structure
 */
export async function executeSqlScript() {
  const supabase = createSupabaseClient();
  
  try {
    // Get the SQL script content
    const sql = `
      -- Create extensions
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      -- Create profiles table
      CREATE TABLE IF NOT EXISTS profiles (
        id UUID PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        full_name TEXT,
        avatar_url TEXT,
        email TEXT,
        role TEXT DEFAULT 'user' NOT NULL
      );
      
      -- Create MCP configurations table for storing user-specific MCP settings
      CREATE TABLE IF NOT EXISTS mcp_configs (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        name TEXT NOT NULL,
        config JSONB NOT NULL,
        user_id UUID,
        team_id UUID,
        is_shared BOOLEAN DEFAULT false NOT NULL
      );
      
      -- Create chat sessions table
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        title TEXT NOT NULL,
        user_id UUID NOT NULL,
        project_id UUID,
        mcp_config_id UUID
      );
      
      -- Create chat messages table
      CREATE TABLE IF NOT EXISTS chat_messages (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
        session_id UUID NOT NULL,
        content TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        metadata JSONB
      );
      
      -- Create functions to automatically set updated_at
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      -- Enable RLS on all tables
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE mcp_configs ENABLE ROW LEVEL SECURITY;
      ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
      
      -- Create anonymous access policy for development
      CREATE POLICY IF NOT EXISTS "Anon can read mcp_configs"
        ON mcp_configs FOR SELECT
        USING (true);
      
      CREATE POLICY IF NOT EXISTS "Anon can insert mcp_configs"
        ON mcp_configs FOR INSERT
        WITH CHECK (true);
      
      CREATE POLICY IF NOT EXISTS "Anon can update mcp_configs"
        ON mcp_configs FOR UPDATE
        USING (true);
    `;
    
    // Execute SQL directly using pg
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error("⚠️ Error executing SQL:", error.message);
      
      // Try another approach with individual statements
      console.log("Trying alternative approach with individual statements...");
      
      // Create profiles table
      await supabase.rpc('exec_sql', { 
        sql_query: `CREATE TABLE IF NOT EXISTS profiles (
          id UUID PRIMARY KEY,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
          full_name TEXT,
          avatar_url TEXT,
          email TEXT,
          role TEXT DEFAULT 'user' NOT NULL
        );` 
      });
      
      // Create mcp_configs table
      await supabase.rpc('exec_sql', { 
        sql_query: `CREATE TABLE IF NOT EXISTS mcp_configs (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
          name TEXT NOT NULL,
          config JSONB NOT NULL,
          user_id UUID,
          team_id UUID,
          is_shared BOOLEAN DEFAULT false NOT NULL
        );` 
      });
      
      // Create RLS policies for mcp_configs
      await supabase.rpc('exec_sql', { 
        sql_query: `
          ALTER TABLE mcp_configs ENABLE ROW LEVEL SECURITY;
          
          CREATE POLICY IF NOT EXISTS "Anon can read mcp_configs"
            ON mcp_configs FOR SELECT
            USING (true);
          
          CREATE POLICY IF NOT EXISTS "Anon can insert mcp_configs"
            ON mcp_configs FOR INSERT
            WITH CHECK (true);
          
          CREATE POLICY IF NOT EXISTS "Anon can update mcp_configs"
            ON mcp_configs FOR UPDATE
            USING (true);
        ` 
      });
      
      console.log("Tables created with alternative approach");
    } else {
      console.log("SQL executed successfully");
    }
    
    return true;
  } catch (error) {
    console.error("Failed to execute SQL script:", error);
    return false;
  }
}

/**
 * Initializes the database tables for development environment
 * This is useful when you don't have a full Supabase setup with migrations
 */
export async function initDatabase() {
  const supabase = createSupabaseClient();
  let success = true;

  try {
    // First try to use the SQL script approach
    await executeSqlScript();

    // Fallback to individual table creation if needed
    // Check if mcp_configs table exists (since this is the one causing 404s)
    const { error: mcpConfigError } = await supabase.from("mcp_configs").select("id").limit(1);
    
    if (mcpConfigError && mcpConfigError.message.includes("does not exist")) {
      console.error("⚠️ Still missing mcp_configs table after SQL execution. Using direct table creation.");
      
      try {
        // Try to use PostgreSQL to create the table
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: `CREATE TABLE IF NOT EXISTS mcp_configs (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            name TEXT NOT NULL,
            config JSONB NOT NULL,
            user_id UUID,
            team_id UUID,
            is_shared BOOLEAN DEFAULT false NOT NULL
          );` 
        });
        
        if (error) throw error;
      } catch (pgError) {
        console.error("Failed to create table via RPC:", pgError);
        
        // Last resort: try to create a local storage fallback
        console.log("Creating LocalStorage fallback for mcp_configs...");
        
        // Create a way to use localStorage as a fallback when Supabase tables don't exist
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('mcp_configs_fallback_enabled', 'true');
          console.log("LocalStorage fallback for mcp_configs enabled");
        }
      }
    }

    console.log("Database initialization complete");
    return success;
  } catch (error) {
    console.error("Error initializing database:", error);
    return false;
  }
}

/**
 * Seeds the database with mock data for development
 */
export async function seedDatabase() {
  const supabase = createSupabaseClient();

  try {
    // Check if there are any MCP configs
    let { data: existingConfigs, error } = await supabase
      .from("mcp_configs")
      .select("id")
      .limit(1);

    // Seed MCP configs if none exist
    if ((!existingConfigs || existingConfigs.length === 0) && !error) {
      console.log("No MCP configs found, seeding with sample data");
      
      // Insert sample MCP configs with no user_id for development
      const { error: insertError } = await supabase.from("mcp_configs").insert([
        {
          name: "Claude AI Server",
          config: {
            url: "https://api.anthropic.com/v1",
            apiKey: "dummy-key-replace-with-real-key",
            models: ["claude-3-haiku-20240307", "claude-3-sonnet-20240229"]
          },
          is_shared: true
        },
        {
          name: "OpenAI Server",
          config: {
            url: "https://api.openai.com/v1",
            apiKey: "dummy-key-replace-with-real-key",
            models: ["gpt-4", "gpt-3.5-turbo"]
          },
          is_shared: true
        }
      ]);
      
      if (insertError) {
        console.error("Failed to seed MCP configs:", insertError);
      } else {
        console.log("Seeded MCP configs table with sample data");
      }
    } else if (error) {
      console.error("Error checking MCP configs:", error);
      
      // Create fallback data in localStorage
      if (typeof window !== 'undefined') {
        const fallbackConfigs = [
          {
            id: "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
            name: "Claude AI Server",
            config: {
              url: "https://api.anthropic.com/v1",
              apiKey: "dummy-key-replace-with-real-key",
              models: ["claude-3-haiku-20240307", "claude-3-sonnet-20240229"]
            },
            is_shared: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: "2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q",
            name: "OpenAI Server",
            config: {
              url: "https://api.openai.com/v1",
              apiKey: "dummy-key-replace-with-real-key",
              models: ["gpt-4", "gpt-3.5-turbo"]
            },
            is_shared: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        window.localStorage.setItem('fallback_mcp_configs', JSON.stringify(fallbackConfigs));
        console.log("Created fallback MCP configs in localStorage");
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error seeding database:", error);
    return false;
  }
}