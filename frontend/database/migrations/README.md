# Database Migration Guide

## PROJECT Concept Phase 1 Migration

### 执行步骤

#### 方式 1: 一次性执行完整 SQL（推荐）

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 左侧菜单点击 **SQL Editor**
4. 点击 **+ New query**
5. 复制 `001_project_concept_phase1.sql` 的全部内容粘贴进去
6. 点击 **Run** 执行
7. 查看输出，确认所有验证都通过（显示 ✓）

#### 方式 2: 分步执行（如果遇到问题）

如果一次性执行失败，可以分步执行：

##### 步骤 1: 增强 projects 表

```sql
-- 添加新字段
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS github_repo_url TEXT,
ADD COLUMN IF NOT EXISTS github_branch TEXT DEFAULT 'main',
ADD COLUMN IF NOT EXISTS project_type TEXT CHECK (project_type IN ('web', 'mobile', 'data', 'slides', 'custom')),
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed', 'paused', 'failed')),
ADD COLUMN IF NOT EXISTS core_context JSONB,
ADD COLUMN IF NOT EXISTS master_conversation_id UUID,
ADD COLUMN IF NOT EXISTS progress JSONB,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(project_type);
CREATE INDEX IF NOT EXISTS idx_projects_master_conversation ON projects(master_conversation_id);
```

##### 步骤 2: 增强 conversations 表

```sql
-- 添加新字段
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS conversation_type TEXT CHECK (conversation_type IN ('master', 'worker')),
ADD COLUMN IF NOT EXISTS parent_conversation_id UUID,
ADD COLUMN IF NOT EXISTS task JSONB;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(conversation_type);
CREATE INDEX IF NOT EXISTS idx_conversations_parent ON conversations(parent_conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversations_project_type ON conversations(project_id, conversation_type);
```

##### 步骤 3: 创建 project_events 表

```sql
CREATE TABLE IF NOT EXISTS project_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_events_project ON project_events(project_id);
CREATE INDEX IF NOT EXISTS idx_project_events_type ON project_events(event_type);
CREATE INDEX IF NOT EXISTS idx_project_events_created ON project_events(created_at DESC);
```

##### 步骤 4: 创建 task_dependencies 表

```sql
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
    CONSTRAINT no_self_dependency CHECK (dependent_conversation_id != dependency_conversation_id),
    CONSTRAINT unique_dependency UNIQUE (dependent_conversation_id, dependency_conversation_id)
);

CREATE INDEX IF NOT EXISTS idx_task_deps_project ON task_dependencies(project_id);
CREATE INDEX IF NOT EXISTS idx_task_deps_dependent ON task_dependencies(dependent_conversation_id);
CREATE INDEX IF NOT EXISTS idx_task_deps_dependency ON task_dependencies(dependency_conversation_id);
CREATE INDEX IF NOT EXISTS idx_task_deps_satisfied ON task_dependencies(satisfied);
```

##### 步骤 5: 配置 Row Level Security (RLS)

```sql
-- Enable RLS
ALTER TABLE project_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

-- project_events policies
CREATE POLICY "Users can view their project events"
    ON project_events FOR SELECT
    USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can create events for their projects"
    ON project_events FOR INSERT
    WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- task_dependencies policies
CREATE POLICY "Users can view their task dependencies"
    ON task_dependencies FOR SELECT
    USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can create task dependencies"
    ON task_dependencies FOR INSERT
    WITH CHECK (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can update task dependencies"
    ON task_dependencies FOR UPDATE
    USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete task dependencies"
    ON task_dependencies FOR DELETE
    USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));
```

##### 步骤 6: 创建触发器和辅助函数（可选但推荐）

```sql
-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_task_dependencies_updated_at ON task_dependencies;
CREATE TRIGGER update_task_dependencies_updated_at
    BEFORE UPDATE ON task_dependencies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Helper functions
CREATE OR REPLACE FUNCTION can_start_task(conv_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    unsatisfied_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO unsatisfied_count
    FROM task_dependencies
    WHERE dependent_conversation_id = conv_id AND satisfied = FALSE;
    RETURN unsatisfied_count = 0;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION calculate_project_progress(proj_id UUID)
RETURNS JSONB AS $$
DECLARE
    total_count INTEGER;
    completed_count INTEGER;
    failed_count INTEGER;
    in_progress_count INTEGER;
    percentage INTEGER;
BEGIN
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE (task->>'status')::TEXT = 'completed'),
        COUNT(*) FILTER (WHERE (task->>'status')::TEXT = 'failed'),
        COUNT(*) FILTER (WHERE (task->>'status')::TEXT = 'in_progress')
    INTO total_count, completed_count, failed_count, in_progress_count
    FROM conversations
    WHERE project_id = proj_id AND conversation_type = 'worker';

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
```

### 验证迁移

执行以下查询验证迁移成功：

```sql
-- 检查 projects 表新字段
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'projects'
AND column_name IN ('github_repo_url', 'github_branch', 'project_type', 'status', 'core_context', 'master_conversation_id', 'progress', 'completed_at');

-- 检查 conversations 表新字段
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'conversations'
AND column_name IN ('conversation_type', 'parent_conversation_id', 'task');

-- 检查新表
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('project_events', 'task_dependencies');

-- 检查索引
SELECT indexname
FROM pg_indexes
WHERE tablename IN ('projects', 'conversations', 'project_events', 'task_dependencies');
```

### 回滚（如果需要）

如果需要回滚此迁移：

```sql
-- 删除新表
DROP TABLE IF EXISTS task_dependencies CASCADE;
DROP TABLE IF EXISTS project_events CASCADE;

-- 删除 conversations 新字段
ALTER TABLE conversations
DROP COLUMN IF EXISTS conversation_type,
DROP COLUMN IF EXISTS parent_conversation_id,
DROP COLUMN IF EXISTS task;

-- 删除 projects 新字段
ALTER TABLE projects
DROP COLUMN IF EXISTS github_repo_url,
DROP COLUMN IF EXISTS github_branch,
DROP COLUMN IF EXISTS project_type,
DROP COLUMN IF EXISTS status,
DROP COLUMN IF EXISTS core_context,
DROP COLUMN IF EXISTS master_conversation_id,
DROP COLUMN IF EXISTS progress,
DROP COLUMN IF EXISTS completed_at;

-- 删除辅助函数
DROP FUNCTION IF EXISTS can_start_task(UUID);
DROP FUNCTION IF EXISTS calculate_project_progress(UUID);
DROP FUNCTION IF EXISTS get_unsatisfied_dependencies(UUID);
DROP FUNCTION IF EXISTS update_updated_at_column();
```

### 常见问题

#### Q: 执行时遇到 "permission denied" 错误
A: 确保你使用的是项目的 service_role key，而不是 anon key。在 Supabase SQL Editor 中执行时会自动使用正确的权限。

#### Q: 已有数据会受影响吗？
A: 不会。所有新字段都使用 `ADD COLUMN IF NOT EXISTS`，并且允许 NULL 值或有默认值。现有数据完全不受影响。

#### Q: 如何验证 RLS 策略正确配置？
A: 在 Supabase Dashboard 左侧菜单点击 **Authentication** > **Policies**，确认 `project_events` 和 `task_dependencies` 表都有相应的策略。

#### Q: 辅助函数是必须的吗？
A: 不是必须的，但强烈推荐。这些函数能简化应用层的逻辑，提升查询效率。

### 迁移后测试

运行以下查询测试新功能：

```sql
-- 测试 calculate_project_progress 函数
SELECT calculate_project_progress('your-project-id');

-- 测试 can_start_task 函数
SELECT can_start_task('your-conversation-id');

-- 查看所有 project_events
SELECT * FROM project_events ORDER BY created_at DESC LIMIT 10;

-- 查看所有 task_dependencies
SELECT * FROM task_dependencies;
```

### 需要帮助？

如果在迁移过程中遇到任何问题：
1. 检查 Supabase Dashboard 的 **Logs** 查看详细错误信息
2. 在 SQL Editor 中逐步执行以定位问题
3. 参考上面的回滚步骤恢复到迁移前状态
