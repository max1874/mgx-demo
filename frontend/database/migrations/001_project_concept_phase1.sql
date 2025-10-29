-- ============================================
-- PROJECT Concept Phase 1 - Database Migration
-- ============================================
-- This migration adds support for the new PROJECT-centric architecture
-- with Master-Worker pattern for multi-conversation parallel development

-- ============================================
-- 1. Enhance projects table
-- ============================================

-- Add new columns to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS github_repo_url TEXT,
ADD COLUMN IF NOT EXISTS github_branch TEXT DEFAULT 'main',
ADD COLUMN IF NOT EXISTS project_type TEXT CHECK (project_type IN ('web', 'mobile', 'data', 'slides', 'custom')),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed', 'paused', 'failed')),
ADD COLUMN IF NOT EXISTS core_context JSONB,
ADD COLUMN IF NOT EXISTS master_conversation_id UUID,
ADD COLUMN IF NOT EXISTS progress JSONB,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

-- Create index on project_type for filtering
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(project_type);

-- Create index on master_conversation_id for lookups
CREATE INDEX IF NOT EXISTS idx_projects_master_conversation ON projects(master_conversation_id);

-- Add comment to describe core_context structure
COMMENT ON COLUMN projects.core_context IS 'Project core context (tech_stack, requirements, architecture, file_structure, coding_standards)';

-- Add comment to describe progress structure
COMMENT ON COLUMN projects.progress IS 'Project progress (total_tasks, completed_tasks, failed_tasks, in_progress_tasks, percentage)';

-- ============================================
-- 2. Enhance conversations table
-- ============================================

-- Add new columns to conversations table
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS conversation_type TEXT CHECK (conversation_type IN ('master', 'worker')),
ADD COLUMN IF NOT EXISTS parent_conversation_id UUID,
ADD COLUMN IF NOT EXISTS task JSONB;

-- Create index on conversation_type for filtering
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(conversation_type);

-- Create index on parent_conversation_id for hierarchy queries
CREATE INDEX IF NOT EXISTS idx_conversations_parent ON conversations(parent_conversation_id);

-- Create index on project_id and conversation_type for efficient queries
CREATE INDEX IF NOT EXISTS idx_conversations_project_type ON conversations(project_id, conversation_type);

-- Add comment to describe task structure
COMMENT ON COLUMN conversations.task IS 'Worker task details (title, description, priority, assigned_agents, dependencies, github_branch, status, deliverables, etc.)';

-- ============================================
-- 3. Create project_events table
-- ============================================

CREATE TABLE IF NOT EXISTS project_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on project_id for efficient queries
CREATE INDEX IF NOT EXISTS idx_project_events_project ON project_events(project_id);

-- Create index on event_type for filtering
CREATE INDEX IF NOT EXISTS idx_project_events_type ON project_events(event_type);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_project_events_created ON project_events(created_at DESC);

-- Create composite index for project timeline queries
CREATE INDEX IF NOT EXISTS idx_project_events_project_created ON project_events(project_id, created_at DESC);

-- Add comment
COMMENT ON TABLE project_events IS 'Audit log for project lifecycle events';

-- Common event types (for reference):
COMMENT ON COLUMN project_events.event_type IS 'Event types: project_created, task_created, task_started, task_completed, task_failed, code_committed, branch_created, pr_created, pr_merged, merge_conflict, deployment_success, deployment_failed, user_intervention, context_updated';

-- ============================================
-- 4. Create task_dependencies table
-- ============================================

CREATE TABLE IF NOT EXISTS task_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    dependent_conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    dependency_conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    dependency_type TEXT DEFAULT 'blocks' CHECK (dependency_type IN ('blocks', 'requires', 'optional')),
    description TEXT,
    satisfied BOOLEAN DEFAULT FALSE,
    satisfied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Prevent circular dependencies (a conversation can't depend on itself)
    CONSTRAINT no_self_dependency CHECK (dependent_conversation_id != dependency_conversation_id),

    -- Prevent duplicate dependencies
    CONSTRAINT unique_dependency UNIQUE (dependent_conversation_id, dependency_conversation_id)
);

-- Create index on project_id for efficient queries
CREATE INDEX IF NOT EXISTS idx_task_deps_project ON task_dependencies(project_id);

-- Create index on dependent_conversation_id for finding what a task depends on
CREATE INDEX IF NOT EXISTS idx_task_deps_dependent ON task_dependencies(dependent_conversation_id);

-- Create index on dependency_conversation_id for finding what depends on a task
CREATE INDEX IF NOT EXISTS idx_task_deps_dependency ON task_dependencies(dependency_conversation_id);

-- Create index on satisfied for filtering unsatisfied dependencies
CREATE INDEX IF NOT EXISTS idx_task_deps_satisfied ON task_dependencies(satisfied);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_task_deps_project_satisfied ON task_dependencies(project_id, satisfied);

-- Add comments
COMMENT ON TABLE task_dependencies IS 'Manages dependencies between Worker Conversations (tasks)';
COMMENT ON COLUMN task_dependencies.dependency_type IS 'blocks: must wait for completion, requires: needs reference output, optional: can run in parallel';

-- ============================================
-- 5. Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on new tables
ALTER TABLE project_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

-- project_events policies
-- Users can view events for projects they own
CREATE POLICY "Users can view their project events"
    ON project_events FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Users can create events for their projects (via API)
CREATE POLICY "Users can create events for their projects"
    ON project_events FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- task_dependencies policies
-- Users can view dependencies for their projects
CREATE POLICY "Users can view their task dependencies"
    ON task_dependencies FOR SELECT
    USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Users can create dependencies for their projects
CREATE POLICY "Users can create task dependencies"
    ON task_dependencies FOR INSERT
    WITH CHECK (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Users can update dependencies for their projects
CREATE POLICY "Users can update task dependencies"
    ON task_dependencies FOR UPDATE
    USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- Users can delete dependencies for their projects
CREATE POLICY "Users can delete task dependencies"
    ON task_dependencies FOR DELETE
    USING (
        project_id IN (
            SELECT id FROM projects WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- 6. Trigger for updated_at
-- ============================================

-- Create or replace function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to task_dependencies
DROP TRIGGER IF EXISTS update_task_dependencies_updated_at ON task_dependencies;
CREATE TRIGGER update_task_dependencies_updated_at
    BEFORE UPDATE ON task_dependencies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to projects (if not exists)
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add trigger to conversations (if not exists)
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. Helper Functions (Optional)
-- ============================================

-- Function to get all unsatisfied dependencies for a conversation
CREATE OR REPLACE FUNCTION get_unsatisfied_dependencies(conv_id UUID)
RETURNS TABLE (
    dependency_conversation_id UUID,
    dependency_type TEXT,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        td.dependency_conversation_id,
        td.dependency_type,
        td.description
    FROM task_dependencies td
    WHERE td.dependent_conversation_id = conv_id
    AND td.satisfied = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to check if a conversation can start (all dependencies satisfied)
CREATE OR REPLACE FUNCTION can_start_task(conv_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    unsatisfied_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO unsatisfied_count
    FROM task_dependencies
    WHERE dependent_conversation_id = conv_id
    AND satisfied = FALSE;

    RETURN unsatisfied_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get project progress statistics
CREATE OR REPLACE FUNCTION calculate_project_progress(proj_id UUID)
RETURNS JSONB AS $$
DECLARE
    total_count INTEGER;
    completed_count INTEGER;
    failed_count INTEGER;
    in_progress_count INTEGER;
    percentage INTEGER;
BEGIN
    -- Count workers in different states
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE (task->>'status')::TEXT = 'completed'),
        COUNT(*) FILTER (WHERE (task->>'status')::TEXT = 'failed'),
        COUNT(*) FILTER (WHERE (task->>'status')::TEXT = 'in_progress')
    INTO total_count, completed_count, failed_count, in_progress_count
    FROM conversations
    WHERE project_id = proj_id
    AND conversation_type = 'worker';

    -- Calculate percentage
    IF total_count > 0 THEN
        percentage := ROUND((completed_count::NUMERIC / total_count) * 100);
    ELSE
        percentage := 0;
    END IF;

    RETURN jsonb_build_object(
        'total_tasks', total_count,
        'completed_tasks', completed_count,
        'failed_tasks', failed_count,
        'in_progress_tasks', in_progress_count,
        'percentage', percentage
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. Verification Queries
-- ============================================

-- Verify projects table columns
DO $$
BEGIN
    RAISE NOTICE 'Verifying projects table...';
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'projects'
        AND column_name = 'github_repo_url'
    ) THEN
        RAISE NOTICE '✓ projects.github_repo_url exists';
    ELSE
        RAISE WARNING '✗ projects.github_repo_url missing';
    END IF;
END $$;

-- Verify conversations table columns
DO $$
BEGIN
    RAISE NOTICE 'Verifying conversations table...';
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'conversations'
        AND column_name = 'conversation_type'
    ) THEN
        RAISE NOTICE '✓ conversations.conversation_type exists';
    ELSE
        RAISE WARNING '✗ conversations.conversation_type missing';
    END IF;
END $$;

-- Verify new tables
DO $$
BEGIN
    RAISE NOTICE 'Verifying new tables...';
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'project_events'
    ) THEN
        RAISE NOTICE '✓ project_events table exists';
    ELSE
        RAISE WARNING '✗ project_events table missing';
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'task_dependencies'
    ) THEN
        RAISE NOTICE '✓ task_dependencies table exists';
    ELSE
        RAISE WARNING '✗ task_dependencies table missing';
    END IF;
END $$;

-- ============================================
-- Migration Complete
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '================================================';
    RAISE NOTICE 'PROJECT Concept Phase 1 Migration Complete!';
    RAISE NOTICE '================================================';
    RAISE NOTICE 'New columns added to projects and conversations';
    RAISE NOTICE 'New tables created: project_events, task_dependencies';
    RAISE NOTICE 'Indexes and RLS policies configured';
    RAISE NOTICE 'Helper functions created';
    RAISE NOTICE '================================================';
END $$;
