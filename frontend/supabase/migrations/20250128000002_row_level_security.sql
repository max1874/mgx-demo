-- MGX Demo - Row Level Security (RLS) Policies
-- This migration sets up security policies to protect user data
-- Author: Bob (System Architect)
-- Date: 2025-01-28

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PROFILES TABLE POLICIES
-- Users can read their own profile and update it
-- Public profiles are readable by everyone
-- ============================================================================

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- PROJECTS TABLE POLICIES
-- Users can manage their own projects
-- Public projects are readable by everyone
-- Link-only projects are readable with direct link
-- ============================================================================

-- Policy: Users can view their own projects
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Anyone can view public projects
CREATE POLICY "Anyone can view public projects"
  ON projects FOR SELECT
  USING (permission = 'public');

-- Policy: Users can view link-only projects (handled in application logic)
CREATE POLICY "Users can view link-only projects"
  ON projects FOR SELECT
  USING (permission = 'link_only');

-- Policy: Users can insert their own projects
CREATE POLICY "Users can insert own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own projects
CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own projects
CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- CONVERSATIONS TABLE POLICIES
-- Users can only access their own conversations
-- ============================================================================

-- Policy: Users can view their own conversations
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own conversations
CREATE POLICY "Users can insert own conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own conversations
CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own conversations
CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- MESSAGES TABLE POLICIES
-- Users can access messages in their conversations
-- ============================================================================

-- Policy: Users can view messages in their conversations
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Policy: Users can insert messages in their conversations
CREATE POLICY "Users can insert messages in own conversations"
  ON messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Policy: Users can update messages in their conversations
CREATE POLICY "Users can update messages in own conversations"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Policy: Users can delete messages in their conversations
CREATE POLICY "Users can delete messages in own conversations"
  ON messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- ============================================================================
-- AGENTS TABLE POLICIES
-- Agents are readable by all authenticated users
-- Only admins can modify agents (handled via service role)
-- ============================================================================

-- Policy: Authenticated users can view all agents
CREATE POLICY "Authenticated users can view agents"
  ON agents FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Note: Agent modifications require service role key (admin access)

-- ============================================================================
-- AGENT_EXECUTIONS TABLE POLICIES
-- Users can view executions in their conversations
-- ============================================================================

-- Policy: Users can view executions in their conversations
CREATE POLICY "Users can view executions in own conversations"
  ON agent_executions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = agent_executions.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Policy: Service role can insert executions (system operation)
CREATE POLICY "Service can insert executions"
  ON agent_executions FOR INSERT
  WITH CHECK (true);

-- Policy: Service role can update executions (system operation)
CREATE POLICY "Service can update executions"
  ON agent_executions FOR UPDATE
  USING (true);

-- ============================================================================
-- FILES TABLE POLICIES
-- Users can manage files in their projects
-- ============================================================================

-- Policy: Users can view files in their projects
CREATE POLICY "Users can view files in own projects"
  ON files FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can view files in public projects
CREATE POLICY "Users can view files in public projects"
  ON files FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = files.project_id
      AND projects.permission = 'public'
    )
  );

-- Policy: Users can insert files in their projects
CREATE POLICY "Users can insert files in own projects"
  ON files FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update files in their projects
CREATE POLICY "Users can update files in own projects"
  ON files FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete files in their projects
CREATE POLICY "Users can delete files in own projects"
  ON files FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- VERSIONS TABLE POLICIES
-- Users can access versions of their projects
-- ============================================================================

-- Policy: Users can view versions of their projects
CREATE POLICY "Users can view versions of own projects"
  ON versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = versions.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Policy: Users can view versions of public projects
CREATE POLICY "Users can view versions of public projects"
  ON versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = versions.project_id
      AND projects.permission = 'public'
    )
  );

-- Policy: Users can insert versions in their projects
CREATE POLICY "Users can insert versions in own projects"
  ON versions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = versions.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- ============================================================================
-- DEPLOYMENTS TABLE POLICIES
-- Users can manage deployments of their projects
-- ============================================================================

-- Policy: Users can view their own deployments
CREATE POLICY "Users can view own deployments"
  ON deployments FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own deployments
CREATE POLICY "Users can insert own deployments"
  ON deployments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own deployments
CREATE POLICY "Users can update own deployments"
  ON deployments FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own deployments
CREATE POLICY "Users can delete own deployments"
  ON deployments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- STORAGE POLICIES (for Supabase Storage buckets)
-- ============================================================================

-- Note: Storage policies are configured separately in Supabase dashboard
-- Recommended bucket structure:
-- - avatars: public bucket for user avatars
-- - project-files: private bucket for project files
-- - deployments: public bucket for deployed projects

-- Storage policy examples (to be applied in Supabase dashboard):
-- 
-- Bucket: avatars
-- - SELECT: authenticated users can view all avatars
-- - INSERT: users can upload their own avatar
-- - UPDATE: users can update their own avatar
-- - DELETE: users can delete their own avatar
--
-- Bucket: project-files
-- - SELECT: users can view files in their projects
-- - INSERT: users can upload files to their projects
-- - UPDATE: users can update files in their projects
-- - DELETE: users can delete files in their projects