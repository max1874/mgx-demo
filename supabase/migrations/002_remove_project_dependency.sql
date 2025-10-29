-- Migration: Remove project_id dependency from conversations
-- This makes each conversation independent without requiring a project

-- Step 1: Make project_id nullable in conversations table (if it exists)
ALTER TABLE conversations 
ALTER COLUMN project_id DROP NOT NULL;

-- Step 2: Update files table to reference conversation_id instead of project_id
-- First, add conversation_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'files' AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE files ADD COLUMN conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 3: Update deployments table to reference conversation_id instead of project_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'deployments' AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE deployments ADD COLUMN conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 4: Update versions table to reference conversation_id instead of project_id
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'versions' AND column_name = 'conversation_id'
  ) THEN
    ALTER TABLE versions ADD COLUMN conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Step 5: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_files_conversation_id ON files(conversation_id);
CREATE INDEX IF NOT EXISTS idx_deployments_conversation_id ON deployments(conversation_id);
CREATE INDEX IF NOT EXISTS idx_versions_conversation_id ON versions(conversation_id);

-- Step 6: Add RLS policies for conversations (if not exists)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON conversations;

-- Create new policies
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations"
  ON conversations FOR DELETE
  USING (auth.uid() = user_id);

-- Note: project_id column is kept for backward compatibility but is now optional
-- Existing data with project_id will continue to work
-- New conversations can be created without project_id