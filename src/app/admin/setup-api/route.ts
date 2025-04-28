import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  try {
    // Create a Supabase client with direct connection
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    
    console.log('Setup URL:', supabaseUrl);
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
    
    // Test if mcp_configs exists by trying to insert data
    try {
      const { error } = await supabase
        .from('mcp_configs')
        .insert({
          name: 'Test Config',
          config: { 
            id: 'test-config',
            name: 'Test Configuration',
            url: 'https://api.example.com',
            status: 'offline',
            capabilities: []
          },
          is_shared: true
        })
        .select()
        .single();
      
      if (!error || error.message.includes('duplicate key')) {
        // Table exists, we're good to go
        console.log('mcp_configs table already exists');
        return NextResponse.json({
          success: true,
          message: 'Database already set up',
          tables: ['mcp_configs']
        });
      }
      
      // If any other error, the table likely doesn't exist
      if (error && error.message && !error.message.includes('does not exist')) {
        console.error('Unexpected error:', error);
        throw error;
      }
      
      console.log('mcp_configs table does not exist, creating...');
    } catch (error: any) {
      console.error('Error testing mcp_configs:', error);
      
      // Only continue if the error is 'relation does not exist'
      if (error && error.message && !error.message.includes('does not exist')) {
        return NextResponse.json({ 
          success: false, 
          error: error?.message || 'Unknown error testing mcp_configs',
          step: 'test_mcp_configs'
        }, { status: 500 });
      }
      
      // Otherwise, continue to try to create the tables
      console.log('Continuing to table creation...');
    }
    
    // Hardcode tables directly into the response
    console.log('Returning table creation script for manual use...');
    
    return NextResponse.json({
      success: false,
      manual: true,
      error: 'Manual table creation required',
      step: 'manual_creation',
      sqlScript: `
-- Run these SQL commands in your Supabase SQL editor:

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

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  email TEXT,
  role TEXT DEFAULT 'user' NOT NULL
);

CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  title TEXT NOT NULL,
  user_id UUID,
  project_id UUID,
  mcp_config_id UUID
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  session_id UUID,
  content TEXT NOT NULL,
  role TEXT NOT NULL,
  metadata JSONB
);

-- Then insert a sample MCP config:
INSERT INTO mcp_configs (name, config, is_shared)
VALUES (
  'Claude AI Server',
  '{
    "id": "claude-server-1",
    "name": "Claude AI Server",
    "url": "https://api.anthropic.com/v1",
    "apiKey": "placeholder-key-replace-me",
    "status": "offline",
    "capabilities": [
      {
        "id": "claude-chat",
        "name": "Claude Chat",
        "type": "model",
        "description": "Claude chat completion",
        "version": "1.0"
      }
    ]
  }'::jsonb,
  true
);
`
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error setting up database:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      step: 'unknown'
    }, { status: 500 });
  }
}