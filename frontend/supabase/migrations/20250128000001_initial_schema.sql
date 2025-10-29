-- MGX Demo - Initial Database Schema
-- This migration creates all core tables for the AI collaboration platform
-- Author: Bob (System Architect)
-- Date: 2025-01-28

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. PROFILES TABLE
-- Extends Supabase auth.users with additional user profile information
-- ============================================================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  avatar_url TEXT,
  credits INTEGER DEFAULT 100 CHECK (credits >= 0),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'max')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for username lookups
CREATE INDEX idx_profiles_username ON profiles(username);

-- ============================================================================
-- 2. PROJECTS TABLE
-- Stores project metadata and generated code
-- ============================================================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  permission TEXT DEFAULT 'private' CHECK (permission IN ('private', 'link_only', 'public')),
  generated_code JSONB DEFAULT '{"html": "", "css": "", "js": "", "files": []}'::jsonb,
  version INTEGER DEFAULT 1 CHECK (version > 0),
  parent_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_permission ON projects(permission);
CREATE INDEX idx_projects_parent_id ON projects(parent_project_id);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);

-- ============================================================================
-- 3. CONVERSATIONS TABLE
-- Stores chat sessions with AI agents
-- ============================================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mode TEXT DEFAULT 'team' CHECK (mode IN ('team', 'engineer', 'research', 'race')),
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for conversation queries
CREATE INDEX idx_conversations_project_id ON conversations(project_id);
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_mode ON conversations(mode);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);

-- ============================================================================
-- 4. MESSAGES TABLE
-- Stores individual messages in conversations
-- ============================================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  agent_name TEXT CHECK (agent_name IN ('Mike', 'Emma', 'Bob', 'Alex', 'David', NULL)),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for message queries
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_agent_name ON messages(agent_name);

-- ============================================================================
-- 5. AGENTS TABLE
-- Stores AI agent definitions and configurations
-- ============================================================================
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  capabilities TEXT[] NOT NULL DEFAULT '{}',
  system_prompt TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for agent name lookups
CREATE INDEX idx_agents_name ON agents(name);
CREATE INDEX idx_agents_is_active ON agents(is_active);

-- ============================================================================
-- 6. AGENT_EXECUTIONS TABLE
-- Logs all agent execution history for debugging and analytics
-- ============================================================================
CREATE TABLE agent_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE NOT NULL,
  input JSONB NOT NULL,
  output JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,
  tokens_used INTEGER DEFAULT 0,
  execution_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for execution queries
CREATE INDEX idx_agent_executions_conversation_id ON agent_executions(conversation_id);
CREATE INDEX idx_agent_executions_agent_id ON agent_executions(agent_id);
CREATE INDEX idx_agent_executions_status ON agent_executions(status);
CREATE INDEX idx_agent_executions_created_at ON agent_executions(created_at DESC);

-- ============================================================================
-- 7. FILES TABLE
-- Stores file metadata and references to Supabase Storage
-- ============================================================================
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  content TEXT,
  storage_path TEXT,
  size INTEGER CHECK (size >= 0),
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for file queries
CREATE INDEX idx_files_project_id ON files(project_id);
CREATE INDEX idx_files_user_id ON files(user_id);
CREATE INDEX idx_files_name ON files(name);
CREATE INDEX idx_files_created_at ON files(created_at DESC);

-- ============================================================================
-- 8. VERSIONS TABLE
-- Stores project version snapshots for Remix and version control
-- ============================================================================
CREATE TABLE versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  snapshot JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, version_number)
);

-- Indexes for version queries
CREATE INDEX idx_versions_project_id ON versions(project_id);
CREATE INDEX idx_versions_version_number ON versions(project_id, version_number DESC);

-- ============================================================================
-- 9. DEPLOYMENTS TABLE
-- Tracks project deployment history
-- ============================================================================
CREATE TABLE deployments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'building', 'deployed', 'failed')),
  config JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deployed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for deployment queries
CREATE INDEX idx_deployments_project_id ON deployments(project_id);
CREATE INDEX idx_deployments_user_id ON deployments(user_id);
CREATE INDEX idx_deployments_status ON deployments(status);
CREATE INDEX idx_deployments_created_at ON deployments(created_at DESC);

-- ============================================================================
-- TRIGGERS: Auto-update updated_at timestamps
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at column
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA: Insert default AI agents
-- ============================================================================

INSERT INTO agents (name, display_name, description, capabilities, system_prompt, config) VALUES
(
  'mike',
  'Mike',
  'Project Lead - Coordinates team activities and manages project workflow',
  ARRAY['task_coordination', 'team_management', 'priority_setting', 'web_search'],
  'You are Mike, the project lead. Your role is to coordinate the team, analyze user requirements, assign tasks to appropriate team members, and ensure smooth project execution. You have access to web search for real-time information.',
  '{"model": "gpt-4", "temperature": 0.7, "max_tokens": 2000}'::jsonb
),
(
  'emma',
  'Emma',
  'Product Manager - Analyzes requirements and creates PRDs',
  ARRAY['requirement_analysis', 'prd_writing', 'user_story_creation', 'competitive_analysis'],
  'You are Emma, the product manager. Your role is to analyze user requirements, create detailed Product Requirement Documents (PRDs), define user stories, and conduct competitive analysis. Focus on user needs and business value.',
  '{"model": "gpt-4", "temperature": 0.7, "max_tokens": 3000}'::jsonb
),
(
  'bob',
  'Bob',
  'System Architect - Designs technical architecture and system design',
  ARRAY['architecture_design', 'tech_stack_selection', 'database_design', 'api_design'],
  'You are Bob, the system architect. Your role is to design system architecture, select appropriate technology stacks, design database schemas, and define API interfaces. Prioritize scalability, maintainability, and best practices.',
  '{"model": "gpt-4", "temperature": 0.5, "max_tokens": 3000}'::jsonb
),
(
  'alex',
  'Alex',
  'Full-stack Engineer - Implements features and writes code',
  ARRAY['frontend_development', 'backend_development', 'code_generation', 'debugging'],
  'You are Alex, a full-stack engineer. Your role is to write clean, efficient, and well-documented code. You specialize in React, TypeScript, Tailwind CSS, and shadcn/ui for frontend, and Node.js for backend. Always follow best practices and write production-ready code.',
  '{"model": "gpt-4", "temperature": 0.3, "max_tokens": 4000}'::jsonb
),
(
  'david',
  'David',
  'Data Analyst - Processes data and creates visualizations',
  ARRAY['data_analysis', 'data_visualization', 'statistical_analysis', 'report_generation'],
  'You are David, a data analyst. Your role is to process data, perform statistical analysis, create visualizations, and generate insights. You excel at transforming raw data into actionable intelligence.',
  '{"model": "gpt-4", "temperature": 0.5, "max_tokens": 3000}'::jsonb
);

-- ============================================================================
-- COMMENTS: Add table and column descriptions
-- ============================================================================

COMMENT ON TABLE profiles IS 'User profile information extending Supabase auth.users';
COMMENT ON TABLE projects IS 'Project metadata and generated code storage';
COMMENT ON TABLE conversations IS 'Chat sessions between users and AI agents';
COMMENT ON TABLE messages IS 'Individual messages within conversations';
COMMENT ON TABLE agents IS 'AI agent definitions and configurations';
COMMENT ON TABLE agent_executions IS 'Execution logs for debugging and analytics';
COMMENT ON TABLE files IS 'File metadata with references to Supabase Storage';
COMMENT ON TABLE versions IS 'Project version snapshots for history and Remix';
COMMENT ON TABLE deployments IS 'Deployment records and status tracking';

COMMENT ON COLUMN profiles.credits IS 'User credit balance for API usage';
COMMENT ON COLUMN profiles.subscription_tier IS 'User subscription level: free, pro, or max';
COMMENT ON COLUMN projects.permission IS 'Project visibility: private, link_only, or public';
COMMENT ON COLUMN projects.generated_code IS 'JSON object containing HTML, CSS, JS, and files';
COMMENT ON COLUMN conversations.mode IS 'Collaboration mode: team, engineer, research, or race';
COMMENT ON COLUMN messages.metadata IS 'Additional message data like code blocks or file references';
COMMENT ON COLUMN agent_executions.tokens_used IS 'Number of LLM tokens consumed';
COMMENT ON COLUMN files.storage_path IS 'Path to file in Supabase Storage bucket';
