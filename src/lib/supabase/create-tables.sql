-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'user', 'guest');
    END IF;
END$$;

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
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE NOT NULL,
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

-- Add triggers for updated_at if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_profiles_updated_at') THEN
        CREATE TRIGGER set_profiles_updated_at
        BEFORE UPDATE ON profiles
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_mcp_configs_updated_at') THEN
        CREATE TRIGGER set_mcp_configs_updated_at
        BEFORE UPDATE ON mcp_configs
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_chat_sessions_updated_at') THEN
        CREATE TRIGGER set_chat_sessions_updated_at
        BEFORE UPDATE ON chat_sessions
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END$$;

-- Row Level Security Policies
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY IF NOT EXISTS "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- MCP Configs policies
CREATE POLICY IF NOT EXISTS "Users can view their own MCP configs or team shared ones"
  ON mcp_configs FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    (
      is_shared = true AND team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      )
    )
    OR
    user_id IS NULL
  );

CREATE POLICY IF NOT EXISTS "Users can update their own MCP configs"
  ON mcp_configs FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can delete their own MCP configs"
  ON mcp_configs FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can create MCP configs"
  ON mcp_configs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Chat sessions policies
CREATE POLICY IF NOT EXISTS "Users can view their own chat sessions"
  ON chat_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can update their own chat sessions"
  ON chat_sessions FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can delete their own chat sessions"
  ON chat_sessions FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can create chat sessions"
  ON chat_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Chat messages policies
CREATE POLICY IF NOT EXISTS "Users can view messages in their sessions"
  ON chat_messages FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM chat_sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can insert messages to their sessions"
  ON chat_messages FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM chat_sessions WHERE user_id = auth.uid()
    )
  );

-- Create anonymous access policy for development
CREATE POLICY IF NOT EXISTS "Anon can read mcp_configs"
  ON mcp_configs FOR SELECT
  USING (true);

CREATE POLICY IF NOT EXISTS "Anon can insert mcp_configs"
  ON mcp_configs FOR INSERT
  WITH CHECK (true);

-- Insert sample MCP configs if none exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM mcp_configs LIMIT 1) THEN
        INSERT INTO mcp_configs (name, config, is_shared)
        VALUES (
            'Claude AI Server',
            '{"url": "https://api.anthropic.com/v1", "apiKey": "dummy-key-replace-with-real-key", "models": ["claude-3-haiku-20240307", "claude-3-sonnet-20240229"]}',
            true
        ),
        (
            'OpenAI Server',
            '{"url": "https://api.openai.com/v1", "apiKey": "dummy-key-replace-with-real-key", "models": ["gpt-4", "gpt-3.5-turbo"]}',
            true
        );
    END IF;
END$$;