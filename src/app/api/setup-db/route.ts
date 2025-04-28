import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Create a Supabase client with admin privileges
    const supabase = createRouteHandlerClient({ cookies });
    
    // 1. Create the mcp_configs table
    const { error: mcpConfigsError } = await supabase.rpc('exec_sql', {
      sql_query: `
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
      `
    });
    
    if (mcpConfigsError) {
      console.error('Failed to create mcp_configs table:', mcpConfigsError);
      return NextResponse.json({ 
        success: false, 
        error: mcpConfigsError.message,
        step: 'create_mcp_configs'
      }, { status: 500 });
    }
    
    // 2. Create profiles table if it doesn't exist
    const { error: profilesError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID PRIMARY KEY,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
          full_name TEXT,
          avatar_url TEXT,
          email TEXT,
          role TEXT DEFAULT 'user' NOT NULL
        );
      `
    });
    
    if (profilesError) {
      console.error('Failed to create profiles table:', profilesError);
      return NextResponse.json({ 
        success: false, 
        error: profilesError.message,
        step: 'create_profiles' 
      }, { status: 500 });
    }
    
    // 3. Create chat_sessions table if it doesn't exist
    const { error: chatSessionsError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS chat_sessions (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
          title TEXT NOT NULL,
          user_id UUID,
          project_id UUID,
          mcp_config_id UUID
        );
      `
    });
    
    if (chatSessionsError) {
      console.error('Failed to create chat_sessions table:', chatSessionsError);
      return NextResponse.json({ 
        success: false, 
        error: chatSessionsError.message,
        step: 'create_chat_sessions'
      }, { status: 500 });
    }
    
    // 4. Create chat_messages table if it doesn't exist
    const { error: chatMessagesError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS chat_messages (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
          session_id UUID,
          content TEXT NOT NULL,
          role TEXT NOT NULL,
          metadata JSONB
        );
      `
    });
    
    if (chatMessagesError) {
      console.error('Failed to create chat_messages table:', chatMessagesError);
      return NextResponse.json({ 
        success: false, 
        error: chatMessagesError.message,
        step: 'create_chat_messages'
      }, { status: 500 });
    }
    
    // 5. Add sample MCP config
    const { error: sampleConfigError } = await supabase
      .from('mcp_configs')
      .insert([
        {
          name: 'Claude AI Server',
          config: {
            id: 'claude-server-1',
            name: 'Claude AI Server',
            url: 'https://api.anthropic.com/v1',
            apiKey: 'placeholder-key-replace-me',
            status: 'offline',
            capabilities: [
              {
                id: 'claude-chat',
                name: 'Claude Chat',
                type: 'model',
                description: 'Claude chat completion',
                version: '1.0',
              }
            ]
          },
          is_shared: true
        }
      ])
      .select();
      
    // If the error is about duplicate keys, that's fine - just means we already have data
    if (sampleConfigError && !sampleConfigError.message.includes('duplicate key')) {
      console.error('Failed to add sample MCP config:', sampleConfigError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully',
      tables: ['mcp_configs', 'profiles', 'chat_sessions', 'chat_messages']
    });
    
  } catch (error: any) {
    console.error('Error setting up database:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      step: 'unknown'
    }, { status: 500 });
  }
}