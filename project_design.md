# PROJECT 概念设计方案

## 1. 概述

PROJECT 是平台的核心概念，代表一个完整的软件项目。每个 PROJECT 关联一个 GitHub repository，维护全局的开发上下文，支持多 Conversation 并行开发，由核心 Agent (Mike) 协调和管理整个项目生命周期。

### 核心特性

- **GitHub 集成**：每个 PROJECT 关联一个 GitHub repo，实现版本控制
- **全局 Context**：维护项目级别的上下文信息（需求、架构、技术栈等）
- **Master-Worker 模式**：通过 Master Conversation 拆解任务，创建多个 Worker Conversation 并行开发
- **智能协调**：Mike 作为项目经理，负责任务拆解、进度监控、结果整合
- **版本管理**：通过 GitHub branches 管理不同任务的代码，支持 Pull Request 和代码审查

---

## 2. 架构设计

### 2.1 整体架构

```
用户
  ↓
PROJECT (例：博客网站)
  │
  ├─ GitHub Repository
  │   ├─ main branch
  │   ├─ feature/frontend
  │   ├─ feature/backend
  │   └─ feature/database
  │
  ├─ Core Context
  │   ├─ Tech Stack
  │   ├─ Requirements (PRD)
  │   ├─ Architecture Design
  │   ├─ File Structure
  │   └─ Constraints
  │
  ├─ Master Conversation (Mike 主导)
  │   ├─ 需求分析
  │   ├─ 任务拆解
  │   ├─ 进度监控
  │   ├─ 冲突解决
  │   └─ 结果整合
  │
  └─ Worker Conversations (并行执行)
      ├─ Worker 1: Frontend Development
      │   ├─ Emma → PRD
      │   ├─ Bob → Architecture
      │   └─ Alex → Implementation
      │
      ├─ Worker 2: Backend API
      │   ├─ Emma → PRD
      │   ├─ Bob → Architecture
      │   └─ Alex → Implementation
      │
      └─ Worker 3: Database Design
          ├─ Bob → Schema Design
          └─ Alex → Migrations
```

### 2.2 Master-Worker 模式

#### Master Conversation
- **角色**：项目协调者（Mike 主导）
- **职责**：
  - 理解用户需求
  - 拆解项目任务
  - 创建 Worker Conversations
  - 监控各 Worker 进度
  - 协调任务依赖
  - 处理冲突和失败
  - 整合最终成果

#### Worker Conversation
- **角色**：任务执行者（Emma, Bob, Alex 等）
- **职责**：
  - 专注于单一任务
  - 遵循 PROJECT Core Context
  - 独立分支开发
  - 完成后通知 Master
  - 接受用户介入和调整

---

## 3. 数据库设计

### 3.1 增强 `projects` 表

```typescript
projects: {
  // 基础字段
  id: string                       // UUID
  user_id: string                  // 用户 ID
  name: string                     // 项目名称，如 "博客网站"
  description: string | null       // 项目描述

  // GitHub 集成
  github_repo_url: string          // GitHub repo URL
  github_branch: string            // 默认分支 (main/master)
  github_access_token: string | null // 加密存储的访问 token

  // 项目元信息
  project_type: 'web' | 'mobile' | 'data' | 'slides' | 'custom'
  status: 'planning' | 'in_progress' | 'completed' | 'paused' | 'failed'

  // 核心 Context (JSON 格式)
  core_context: {
    // 技术栈
    tech_stack: {
      frontend: string[]           // ['Next.js', 'React', 'Tailwind CSS']
      backend: string[]            // ['Node.js', 'Express', 'PostgreSQL']
      infrastructure: string[]     // ['Vercel', 'Supabase']
      tools: string[]              // ['Git', 'ESLint', 'Prettier']
    }

    // 核心需求
    requirements: {
      summary: string              // 项目概述
      goals: string[]              // 项目目标
      user_stories: string[]       // 用户故事
      features: string[]           // 功能列表
      constraints: string[]        // 约束条件
    }

    // 架构设计
    architecture: {
      system_design: string        // 系统架构描述
      database_schema: object      // 数据库结构
      api_design: object           // API 设计
      component_hierarchy: object  // 组件层级
    }

    // 文件结构
    file_structure: {
      // 项目文件树结构
      [path: string]: {
        type: 'file' | 'directory'
        description: string
        owner: string              // 哪个 Agent 负责
      }
    }

    // 开发规范
    coding_standards: {
      style_guide: string          // 代码风格指南
      naming_conventions: object   // 命名规范
      best_practices: string[]     // 最佳实践
    }
  }

  // Master Conversation
  master_conversation_id: string | null

  // 进度追踪
  progress: {
    total_tasks: number            // 总任务数
    completed_tasks: number        // 已完成任务数
    failed_tasks: number           // 失败任务数
    percentage: number             // 完成百分比
  }

  // 时间戳
  created_at: string
  updated_at: string
  completed_at: string | null
}
```

### 3.2 增强 `conversations` 表

```typescript
conversations: {
  // 基础字段
  id: string
  project_id: string
  user_id: string

  // Conversation 类型
  conversation_type: 'master' | 'worker'
  parent_conversation_id: string | null  // Worker 指向其 Master

  // Worker 任务信息 (仅 worker 类型有值)
  task: {
    // 任务基本信息
    title: string                  // "Frontend Development"
    description: string            // 任务详细描述
    priority: 'high' | 'medium' | 'low'

    // 分配信息
    assigned_agents: string[]      // ['Emma', 'Bob', 'Alex']
    lead_agent: string             // 'Alex' - 主要负责人

    // 依赖关系
    dependencies: string[]         // 依赖的其他 conversation IDs
    blocked_by: string[]           // 被哪些任务阻塞
    blocks: string[]               // 阻塞哪些任务

    // Git 信息
    github_branch: string          // 'feature/frontend'
    pull_request_url: string | null

    // 任务状态
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'blocked'

    // 产出
    deliverables: {
      code_files: string[]         // 生成的代码文件路径
      documentation: string        // 文档
      test_coverage: number        // 测试覆盖率
      deployment_url: string | null // 部署 URL
    }

    // 时间追踪
    estimated_time: string         // 预估时间
    actual_time: string | null     // 实际用时
    started_at: string | null
    completed_at: string | null
  } | null

  // 现有字段
  mode: 'team' | 'engineer'
  title: string
  created_at: string
  updated_at: string
}
```

### 3.3 新增 `project_events` 表

用于审计和追踪项目生命周期中的关键事件。

```typescript
project_events: {
  id: string
  project_id: string
  conversation_id: string | null

  // 事件类型
  event_type:
    | 'project_created'          // 项目创建
    | 'task_created'             // 任务创建
    | 'task_started'             // 任务开始
    | 'task_completed'           // 任务完成
    | 'task_failed'              // 任务失败
    | 'code_committed'           // 代码提交
    | 'branch_created'           // 分支创建
    | 'pr_created'               // PR 创建
    | 'pr_merged'                // PR 合并
    | 'merge_conflict'           // 合并冲突
    | 'deployment_success'       // 部署成功
    | 'deployment_failed'        // 部署失败
    | 'user_intervention'        // 用户介入
    | 'context_updated'          // Context 更新

  // 事件详情
  metadata: {
    agent_name: string | null
    message: string
    details: object
    severity: 'info' | 'warning' | 'error'
  }

  created_at: string
}
```

### 3.4 新增 `task_dependencies` 表

管理任务之间的依赖关系。

```typescript
task_dependencies: {
  id: string
  project_id: string

  // 依赖关系
  dependent_conversation_id: string    // 依赖者
  dependency_conversation_id: string   // 被依赖者

  // 依赖类型
  dependency_type:
    | 'blocks'                  // 阻塞型：必须等待完成
    | 'requires'                // 需要型：需要参考产出
    | 'optional'                // 可选型：可以并行

  // 依赖描述
  description: string           // "前端需要后端 API endpoints"

  // 状态
  satisfied: boolean            // 依赖是否已满足
  satisfied_at: string | null

  created_at: string
  updated_at: string
}
```

---

## 4. 用户交互流程

### 4.1 创建 PROJECT

#### UI 交互

```
1. 用户点击 "New Project" 按钮
   ↓
2. 显示 Project 创建对话框：
   ┌─────────────────────────────────────┐
   │  Create New Project                 │
   ├─────────────────────────────────────┤
   │  Project Name: [博客网站]           │
   │  Description:  [个人技术博客...]     │
   │                                     │
   │  Project Type:                      │
   │  ○ Web Application                  │
   │  ○ Mobile App                       │
   │  ○ Data Analysis                    │
   │  ○ Slides/Presentation              │
   │  ○ Custom                           │
   │                                     │
   │  GitHub Repository:                 │
   │  ○ Create new repository            │
   │  ● Link existing repository         │
   │    URL: [github.com/user/blog]      │
   │                                     │
   │  [Cancel]  [Create Project]         │
   └─────────────────────────────────────┘
   ↓
3. 系统验证 GitHub 连接
   ↓
4. 创建 PROJECT 和 Master Conversation
   ↓
5. 进入 Master Conversation 界面
```

#### 后端流程

```typescript
// 1. 创建 PROJECT
const project = await createProject({
  user_id: user.id,
  name: "博客网站",
  description: "个人技术博客，支持 Markdown 文章发布",
  project_type: "web",
  github_repo_url: "https://github.com/user/blog",
  github_branch: "main",
  status: "planning"
});

// 2. 验证 GitHub 访问权限
await verifyGitHubAccess(project.github_repo_url, user.github_token);

// 3. 创建 Master Conversation
const masterConversation = await createConversation({
  project_id: project.id,
  user_id: user.id,
  conversation_type: "master",
  mode: "team",
  title: `Master: ${project.name}`
});

// 4. 更新 PROJECT 的 master_conversation_id
await updateProject(project.id, {
  master_conversation_id: masterConversation.id
});

// 5. 记录事件
await createProjectEvent({
  project_id: project.id,
  event_type: "project_created",
  metadata: {
    message: `Project "${project.name}" created and linked to ${project.github_repo_url}`
  }
});
```

### 4.2 任务拆解与确认

#### Master Conversation 中的交互

```
用户：
"创建一个博客网站，需要支持 Markdown 文章发布、
评论系统、标签分类和全文搜索"

     ↓

Mike (Master Agent):
"我理解了你的需求。让我分析一下项目范围...

📋 项目分析
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
项目类型：Web Application
核心功能：
  • Markdown 文章编辑和渲染
  • 用户评论系统
  • 标签分类和筛选
  • 全文搜索引擎

推荐技术栈：
  • Frontend: Next.js 14, React, Tailwind CSS
  • Backend: Next.js API Routes, Prisma
  • Database: PostgreSQL
  • Search: Algolia / ElasticSearch
  • Deployment: Vercel

📦 任务拆解
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

我建议将项目拆解为以下 5 个并行任务：

┌────────────────────────────────────────┐
│ Task 1: 数据库设计与基础架构           │
├────────────────────────────────────────┤
│ 负责人: Bob (架构师) + Alex (工程师)   │
│ 分支: feature/database                 │
│ 预计: 4-6 小时                         │
│                                        │
│ 产出:                                  │
│ • PostgreSQL schema 设计               │
│ • Prisma models                        │
│ • Database migrations                  │
│ • 初始化种子数据                       │
│                                        │
│ 依赖: 无                               │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ Task 2: 用户认证与权限系统             │
├────────────────────────────────────────┤
│ 负责人: Emma (PM) + Alex (工程师)      │
│ 分支: feature/auth                     │
│ 预计: 6-8 小时                         │
│                                        │
│ 产出:                                  │
│ • NextAuth.js 配置                     │
│ • 用户注册/登录界面                    │
│ • JWT token 管理                       │
│ • RBAC 权限系统                        │
│                                        │
│ 依赖: Task 1 (需要 User model)         │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ Task 3: Markdown 编辑器与文章管理      │
├────────────────────────────────────────┤
│ 负责人: Emma + Bob + Alex (全团队)    │
│ 分支: feature/editor                   │
│ 预计: 8-10 小时                        │
│                                        │
│ 产出:                                  │
│ • Markdown 编辑器 (react-markdown)     │
│ • 文章 CRUD API                        │
│ • 文章列表/详情页面                    │
│ • 图片上传功能                         │
│                                        │
│ 依赖: Task 1, Task 2                   │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ Task 4: 评论系统                       │
├────────────────────────────────────────┤
│ 负责人: Alex (工程师)                  │
│ 分支: feature/comments                 │
│ 预计: 4-6 小时                         │
│                                        │
│ 产出:                                  │
│ • 评论 API (CRUD)                      │
│ • 评论组件 (嵌套回复)                  │
│ • 实时通知                             │
│ • 评论审核系统                         │
│                                        │
│ 依赖: Task 1, Task 2                   │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ Task 5: 标签系统与全文搜索             │
├────────────────────────────────────────┤
│ 负责人: Bob + Alex                     │
│ 分支: feature/search                   │
│ 预计: 6-8 小时                         │
│                                        │
│ 产出:                                  │
│ • 标签管理系统                         │
│ • 标签筛选界面                         │
│ • Algolia 搜索集成                     │
│ • 搜索结果页面                         │
│                                        │
│ 依赖: Task 1, Task 3                   │
└────────────────────────────────────────┘

⚡ 并行执行计划
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase 1 (并行):
  • Task 1: 数据库设计 ← 立即开始

Phase 2 (并行):
  • Task 2: 用户认证 ← 等待 Task 1 完成
  • Task 4: 评论系统 ← 等待 Task 1 完成

Phase 3 (并行):
  • Task 3: 文章编辑器 ← 等待 Task 1, 2 完成
  • Task 5: 搜索功能 ← 等待 Task 1 完成

预计总耗时: 12-16 小时 (考虑并行)
预计串行耗时: 28-38 小时

是否确认此拆解方案？你可以：
  [✅ 确认并开始]  [📝 调整方案]  [❌ 取消]"
```

#### 用户确认流程

**选项 1: 确认并开始**
```
用户点击 [✅ 确认并开始]
  ↓
Mike: "收到！正在创建 5 个 Worker Conversations..."
  ↓
系统创建 5 个 Worker Conversations
  ↓
Mike: "✅ 所有任务已创建！

  Task 1 正在执行中...
  Task 2-5 等待依赖完成

  你可以点击任意任务查看详情或介入开发。"
```

**选项 2: 调整方案**
```
用户点击 [📝 调整方案]
  ↓
显示调整对话框：
  ┌─────────────────────────────────────┐
  │ 调整任务拆解方案                    │
  ├─────────────────────────────────────┤
  │ 你想如何调整？                      │
  │                                     │
  │ [修改任务数量]                      │
  │ [调整技术栈]                        │
  │ [更改依赖关系]                      │
  │ [自定义拆解]                        │
  │                                     │
  │ 或者直接告诉我:                     │
  │ [文本输入框]                        │
  │                                     │
  │ [取消]  [重新生成方案]              │
  └─────────────────────────────────────┘
```

**选项 3: 取消**
```
用户点击 [❌ 取消]
  ↓
Mike: "好的，已取消任务拆解。请告诉我你的新需求，
      或者我们可以重新讨论项目规划。"
```

### 4.3 并行开发

#### 依赖关系处理

```typescript
// 系统自动检测任务依赖
class TaskScheduler {
  async scheduleTask(conversations: Conversation[]): Promise<void> {
    // 1. 构建依赖图
    const dependencyGraph = this.buildDependencyGraph(conversations);

    // 2. 拓扑排序，确定执行顺序
    const executionPhases = this.topologicalSort(dependencyGraph);

    // 3. 按阶段并行执行
    for (const phase of executionPhases) {
      // 同一阶段的任务并行执行
      await Promise.all(
        phase.map(conversation => this.startWorkerConversation(conversation))
      );

      // 等待当前阶段所有任务完成
      await this.waitForPhaseCompletion(phase);
    }
  }

  buildDependencyGraph(conversations: Conversation[]): DependencyGraph {
    // 构建任务依赖图
    // Task 2, 4 依赖 Task 1
    // Task 3 依赖 Task 1, 2
    // Task 5 依赖 Task 1
  }

  topologicalSort(graph: DependencyGraph): Conversation[][] {
    // 返回：
    // Phase 1: [Task 1]
    // Phase 2: [Task 2, Task 4, Task 5]  ← 并行
    // Phase 3: [Task 3]
  }
}
```

#### 执行过程可视化

```
Master Conversation 界面显示实时进度：

📊 项目进度: 博客网站
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[████████████░░░░░░░░] 60% (3/5 完成)

Phase 1:
  ✅ Task 1: 数据库设计          [已完成] 3.5h
     feature/database merged to main

Phase 2: (并行执行中)
  ✅ Task 2: 用户认证            [已完成] 5.2h
     feature/auth merged to main

  🔄 Task 4: 评论系统            [进行中] 2.1h / 预计 4-6h
     Alex 正在实现评论 API...
     [查看详情] [介入]

  ✅ Task 5: 搜索功能            [已完成] 6.8h
     feature/search merged to main

Phase 3: (等待中)
  ⏳ Task 3: 文章编辑器          [等待] Task 2 已完成
     依赖已满足，准备开始...
     [立即开始]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[刷新]  [查看所有任务]  [查看 GitHub]
```

### 4.4 用户介入

用户可以在任何阶段介入 Worker Conversation：

#### 介入场景 1: 调整实现方向

```
用户点击 Task 4 的 [介入] 按钮
  ↓
进入 Worker Conversation 4 界面
  ↓
用户: "评论系统不需要嵌套回复，只要一级评论就够了"
  ↓
Alex: "明白了！我会简化评论结构，只实现一级评论。
      让我重新调整代码..."
  ↓
Alex 调整实现
  ↓
Alex: "✅ 已更新评论系统为单级结构，代码已提交。"
```

#### 介入场景 2: 修复问题

```
Master Conversation 显示：
  ❌ Task 4: 评论系统 [失败]
     错误: 数据库连接超时
  ↓
用户点击 [查看详情]
  ↓
用户: "数据库连接字符串配置错误了，
      应该使用 DATABASE_URL 环境变量"
  ↓
Alex: "感谢指出！我已更新环境变量配置，
      正在重新运行..."
  ↓
系统自动重试 Task 4
```

#### 介入场景 3: 审查代码

```
用户在 Worker Conversation 界面看到：
  ✅ 代码已提交到 feature/comments
  [查看代码] [查看 PR] [请求修改]
  ↓
用户点击 [查看代码]
  ↓
显示 GitHub 文件变更
  ↓
用户: "评论的时间格式应该显示相对时间，
      比如 '2 小时前'"
  ↓
Alex: "好的！我会添加相对时间格式化功能..."
  ↓
Alex 更新代码并推送
```

### 4.5 失败处理

#### 失败检测与通知

```typescript
class MikeAgent extends BaseAgent {
  async monitorWorkerProgress(conversation: Conversation): Promise<void> {
    // 监听 Worker Conversation 的状态变化

    if (conversation.task.status === 'failed') {
      // 1. 分析失败原因
      const analysis = await this.analyzeFailure(conversation);

      // 2. 生成解决方案
      const solutions = await this.generateSolutions(analysis);

      // 3. 通知用户
      await this.notifyUserAboutFailure(conversation, solutions);
    }
  }

  async notifyUserAboutFailure(
    conversation: Conversation,
    solutions: Solution[]
  ): Promise<void> {
    const message = `
❌ 任务失败: ${conversation.task.title}

失败原因:
${conversation.task.error}

我建议以下解决方案:

1. ${solutions[0].description}
   ${solutions[0].action}
   [自动修复]

2. ${solutions[1].description}
   ${solutions[1].action}
   [调整方案]

3. 手动介入
   [查看详情]

你希望如何处理？`;

    await this.sendMessage(message);
  }
}
```

#### 用户决策流程

```
Mike 在 Master Conversation 中通知:

❌ 任务失败: 评论系统
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
失败原因:
  数据库 schema 中缺少 comments 表

我建议以下解决方案:

┌────────────────────────────────────────┐
│ 方案 1: 自动修复 (推荐)                │
├────────────────────────────────────────┤
│ 运行缺失的数据库 migration             │
│ 预计时间: 2 分钟                       │
│                                        │
│ [✅ 自动修复]                          │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ 方案 2: 调整任务拆解                   │
├────────────────────────────────────────┤
│ 将评论表设计合并到 Task 1              │
│ 重新规划任务依赖                       │
│                                        │
│ [📝 调整方案]                          │
└────────────────────────────────────────┘

┌────────────────────────────────────────┐
│ 方案 3: 手动介入                       │
├────────────────────────────────────────┤
│ 进入 Worker Conversation 查看详情      │
│ 手动指导 Agent 解决问题                │
│                                        │
│ [🔍 查看详情]                          │
└────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
你希望如何处理？
```

#### 重试机制

**选项 1: 自动修复 + 重试**
```
用户点击 [✅ 自动修复]
  ↓
Mike: "正在执行自动修复..."
  ↓
Alex (Task 1): "正在运行 migration..."
  ↓
Alex (Task 1): "✅ Migration 完成，comments 表已创建"
  ↓
Mike: "依赖问题已解决，正在重试 Task 4..."
  ↓
Alex (Task 4): "正在重新实现评论系统..."
  ↓
Alex (Task 4): "✅ 评论系统已完成"
  ↓
Mike: "✅ Task 4 已成功完成！继续进行后续任务..."
```

**选项 2: 调整方案**
```
用户点击 [📝 调整方案]
  ↓
Mike: "好的，我会重新规划任务依赖关系..."
  ↓
Mike 重新生成拆解方案
  ↓
Mike: "已更新任务拆解方案，请确认:

  [新的拆解方案...]

  [确认] [继续调整]"
```

**选项 3: 手动介入**
```
用户点击 [🔍 查看详情]
  ↓
进入 Worker Conversation 4
  ↓
显示完整的错误日志和上下文
  ↓
用户可以直接与 Alex 对话解决问题
```

---

## 5. 核心组件实现

### 5.1 MikeAgent (Master 模式)

```typescript
class MikeAgent extends BaseAgent {
  /**
   * 处理 PROJECT 级别的用户请求
   */
  async processProjectRequest(
    userMessage: string,
    project: Project
  ): Promise<void> {
    // 1. 分析需求
    const analysis = await this.analyzeProjectRequirements(
      userMessage,
      project
    );

    // 2. 更新 Core Context
    await this.updateCoreContext(project.id, analysis);

    // 3. 拆解任务
    const taskPlan = await this.decomposeIntoTasks(analysis, project);

    // 4. 展示方案，等待用户确认
    await this.presentTaskPlan(taskPlan);

    // 5. 用户确认后，创建 Worker Conversations
    const confirmed = await this.waitForUserConfirmation();
    if (confirmed) {
      await this.executeTaskPlan(taskPlan, project);
    }
  }

  /**
   * 分析项目需求
   */
  private async analyzeProjectRequirements(
    userMessage: string,
    project: Project
  ): Promise<ProjectAnalysis> {
    const prompt = `
你是 Mike，一个经验丰富的项目经理。
请分析以下项目需求：

项目类型: ${project.project_type}
项目描述: ${project.description}
用户需求: ${userMessage}

请输出：
1. 核心功能列表
2. 推荐技术栈
3. 系统架构建议
4. 开发规范建议

以 JSON 格式输出。`;

    const response = await this.generateResponse(prompt);
    return JSON.parse(response);
  }

  /**
   * 拆解任务
   */
  private async decomposeIntoTasks(
    analysis: ProjectAnalysis,
    project: Project
  ): Promise<TaskPlan> {
    const prompt = `
基于以下项目分析，将项目拆解为多个可并行的开发任务：

${JSON.stringify(analysis, null, 2)}

要求：
1. 每个任务应该独立、内聚
2. 明确任务之间的依赖关系
3. 优先支持并行执行
4. 每个任务指定负责的 Agent
5. 估算每个任务的时间
6. 为每个任务指定 Git 分支名

输出 JSON 格式的任务计划。`;

    const response = await this.generateResponse(prompt);
    return JSON.parse(response);
  }

  /**
   * 展示任务计划
   */
  private async presentTaskPlan(taskPlan: TaskPlan): Promise<void> {
    let message = `
📋 项目分析
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${this.formatAnalysis(taskPlan.analysis)}

📦 任务拆解
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

我建议将项目拆解为以下 ${taskPlan.tasks.length} 个任务：

`;

    taskPlan.tasks.forEach((task, index) => {
      message += this.formatTask(task, index + 1);
    });

    message += `
⚡ 并行执行计划
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${this.formatExecutionPlan(taskPlan)}

预计总耗时: ${taskPlan.estimated_parallel_time}
预计串行耗时: ${taskPlan.estimated_serial_time}

是否确认此拆解方案？`;

    await this.sendMessage(message);
  }

  /**
   * 执行任务计划
   */
  private async executeTaskPlan(
    taskPlan: TaskPlan,
    project: Project
  ): Promise<void> {
    // 1. 创建所有 Worker Conversations
    const workers = await Promise.all(
      taskPlan.tasks.map(task =>
        this.createWorkerConversation(project, task)
      )
    );

    // 2. 创建任务依赖关系
    await this.createTaskDependencies(workers, taskPlan);

    // 3. 开始调度执行
    await this.scheduleAndExecuteTasks(workers);

    // 4. 监控进度
    await this.monitorProgress(workers);
  }

  /**
   * 创建 Worker Conversation
   */
  private async createWorkerConversation(
    project: Project,
    task: Task
  ): Promise<Conversation> {
    const conversation = await createConversation({
      project_id: project.id,
      user_id: project.user_id,
      conversation_type: 'worker',
      parent_conversation_id: this.conversationId,
      task: {
        title: task.title,
        description: task.description,
        priority: task.priority,
        assigned_agents: task.agents,
        lead_agent: task.lead_agent,
        dependencies: task.dependencies,
        github_branch: task.branch,
        status: 'pending',
        estimated_time: task.estimated_time
      },
      mode: 'team',
      title: `Worker: ${task.title}`
    });

    // 创建 Git 分支
    await this.createGitBranch(project, task.branch);

    // 记录事件
    await createProjectEvent({
      project_id: project.id,
      conversation_id: conversation.id,
      event_type: 'task_created',
      metadata: {
        message: `Task "${task.title}" created`,
        details: task
      }
    });

    return conversation;
  }

  /**
   * 监控所有 Worker 的进度
   */
  private async monitorProgress(
    workers: Conversation[]
  ): Promise<void> {
    // 订阅所有 Worker Conversation 的状态变化
    workers.forEach(worker => {
      this.subscribeToWorker(worker);
    });

    // 定期检查整体进度
    const progressInterval = setInterval(async () => {
      const progress = await this.calculateProgress(workers);
      await this.updateProjectProgress(progress);

      // 检查是否全部完成
      if (progress.percentage === 100) {
        clearInterval(progressInterval);
        await this.onAllTasksCompleted(workers);
      }
    }, 5000); // 每 5 秒检查一次
  }

  /**
   * 所有任务完成后的处理
   */
  private async onAllTasksCompleted(
    workers: Conversation[]
  ): Promise<void> {
    // 1. 合并所有分支
    await this.mergeAllBranches(workers);

    // 2. 运行集成测试
    await this.runIntegrationTests();

    // 3. 生成项目文档
    await this.generateProjectDocumentation(workers);

    // 4. 通知用户
    await this.notifyProjectCompletion();
  }
}
```

### 5.2 WorkerOrchestrator

```typescript
/**
 * Worker Conversation 的协调器
 * 负责在单个 Worker 内协调多个 Agent 的工作
 */
class WorkerOrchestrator extends AgentOrchestrator {
  private task: Task;
  private project: Project;

  constructor(config: OrchestratorConfig, task: Task, project: Project) {
    super(config);
    this.task = task;
    this.project = project;
  }

  /**
   * 执行 Worker 任务
   */
  async executeTask(): Promise<TaskResult> {
    try {
      // 1. 加载 PROJECT Core Context
      const coreContext = await this.loadCoreContext(this.project.id);

      // 2. 设置所有 Agent 的上下文
      await this.setAgentsContext(coreContext);

      // 3. 按标准流程执行
      const result = await this.executeStandardWorkflow();

      // 4. 提交代码
      await this.commitAndPushCode(result);

      // 5. 创建 Pull Request
      await this.createPullRequest(result);

      // 6. 通知 Master
      await this.notifyMaster('completed', result);

      return result;

    } catch (error) {
      // 失败处理
      await this.notifyMaster('failed', { error });
      throw error;
    }
  }

  /**
   * 执行标准工作流
   */
  private async executeStandardWorkflow(): Promise<TaskResult> {
    const agents = this.task.assigned_agents;

    let result: TaskResult = {
      code: '',
      documentation: '',
      tests: []
    };

    // Emma: PRD (如果分配了)
    if (agents.includes('Emma')) {
      const prd = await this.runEmma();
      result.prd = prd;
    }

    // Bob: Architecture (如果分配了)
    if (agents.includes('Bob')) {
      const architecture = await this.runBob(result.prd);
      result.architecture = architecture;
    }

    // Alex: Implementation (必须)
    const implementation = await this.runAlex(result.prd, result.architecture);
    result.code = implementation.code;
    result.tests = implementation.tests;

    // 生成文档
    result.documentation = await this.generateDocumentation(result);

    return result;
  }

  /**
   * 加载项目核心上下文
   */
  private async loadCoreContext(projectId: string): Promise<CoreContext> {
    const project = await getProject(projectId);
    return project.core_context;
  }

  /**
   * 提交代码到 Git
   */
  private async commitAndPushCode(result: TaskResult): Promise<void> {
    const github = new GitHubClient(this.project.github_repo_url);

    // 1. 写入文件
    await github.writeFiles(result.code);

    // 2. Commit
    await github.commit(
      `feat: ${this.task.title}\n\n${this.task.description}`
    );

    // 3. Push
    await github.push(this.task.github_branch);

    // 4. 记录事件
    await createProjectEvent({
      project_id: this.project.id,
      conversation_id: this.conversationId,
      event_type: 'code_committed',
      metadata: {
        branch: this.task.github_branch,
        message: `Code committed for ${this.task.title}`
      }
    });
  }

  /**
   * 创建 Pull Request
   */
  private async createPullRequest(result: TaskResult): Promise<string> {
    const github = new GitHubClient(this.project.github_repo_url);

    const pr = await github.createPullRequest({
      title: this.task.title,
      body: this.formatPRDescription(result),
      head: this.task.github_branch,
      base: this.project.github_branch
    });

    // 更新 task 的 PR URL
    await updateConversation(this.conversationId, {
      task: {
        ...this.task,
        pull_request_url: pr.url
      }
    });

    return pr.url;
  }

  /**
   * 通知 Master Conversation
   */
  private async notifyMaster(
    status: 'completed' | 'failed',
    data: any
  ): Promise<void> {
    const message = createAgentMessage(
      MessageType.TASK_COMPLETED,
      status === 'completed'
        ? `Task "${this.task.title}" completed successfully`
        : `Task "${this.task.title}" failed: ${data.error}`,
      this.config.role,
      AgentRole.MIKE,
      {
        task: this.task,
        result: data
      }
    );

    // 发送消息到 Master Conversation
    await sendMessageToConversation(
      this.task.parent_conversation_id,
      message
    );
  }
}
```

### 5.3 GitHub 集成

```typescript
/**
 * GitHub 客户端，处理所有 Git 操作
 */
class GitHubClient {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(repoUrl: string, accessToken: string) {
    this.octokit = new Octokit({ auth: accessToken });
    const { owner, repo } = this.parseRepoUrl(repoUrl);
    this.owner = owner;
    this.repo = repo;
  }

  /**
   * 创建分支
   */
  async createBranch(branchName: string, fromBranch: string = 'main'): Promise<void> {
    // 1. 获取 from branch 的最新 commit SHA
    const { data: ref } = await this.octokit.git.getRef({
      owner: this.owner,
      repo: this.repo,
      ref: `heads/${fromBranch}`
    });

    // 2. 创建新分支
    await this.octokit.git.createRef({
      owner: this.owner,
      repo: this.repo,
      ref: `refs/heads/${branchName}`,
      sha: ref.object.sha
    });
  }

  /**
   * 写入文件
   */
  async writeFiles(files: CodeFile[]): Promise<void> {
    for (const file of files) {
      await this.writeFile(file.path, file.content);
    }
  }

  /**
   * 写入单个文件
   */
  async writeFile(path: string, content: string): Promise<void> {
    // 获取文件当前内容（如果存在）
    let sha: string | undefined;
    try {
      const { data } = await this.octokit.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path
      });
      if ('sha' in data) {
        sha = data.sha;
      }
    } catch (error) {
      // 文件不存在，sha 为 undefined
    }

    // 创建或更新文件
    await this.octokit.repos.createOrUpdateFileContents({
      owner: this.owner,
      repo: this.repo,
      path,
      message: `Update ${path}`,
      content: Buffer.from(content).toString('base64'),
      sha
    });
  }

  /**
   * 创建 Pull Request
   */
  async createPullRequest(options: {
    title: string;
    body: string;
    head: string;
    base: string;
  }): Promise<PullRequest> {
    const { data } = await this.octokit.pulls.create({
      owner: this.owner,
      repo: this.repo,
      ...options
    });

    return {
      number: data.number,
      url: data.html_url,
      status: data.state
    };
  }

  /**
   * 合并 Pull Request
   */
  async mergePullRequest(prNumber: number): Promise<void> {
    await this.octokit.pulls.merge({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
      merge_method: 'squash'
    });
  }

  /**
   * 检测合并冲突
   */
  async checkMergeConflicts(prNumber: number): Promise<boolean> {
    const { data } = await this.octokit.pulls.get({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber
    });

    return data.mergeable === false;
  }
}
```

---

## 6. UI/UX 设计

### 6.1 PROJECT 列表页

```
┌────────────────────────────────────────────────────┐
│  My Projects                    [+ New Project]    │
├────────────────────────────────────────────────────┤
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ 📁 博客网站                    🟢 In Progress │ │
│  │ github.com/user/blog-website                 │ │
│  │ ────────────────────────────────────────     │ │
│  │ Progress: ███████████░░░░░ 60% (3/5 tasks)   │ │
│  │ Updated: 2 hours ago                         │ │
│  │                                              │ │
│  │ [Open] [Settings] [Delete]                   │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ 📁 电商平台                    ✅ Completed   │ │
│  │ github.com/user/ecommerce                    │ │
│  │ ────────────────────────────────────────     │ │
│  │ Progress: ████████████████ 100% (8/8 tasks)  │ │
│  │ Completed: 1 day ago                         │ │
│  │                                              │ │
│  │ [Open] [Settings] [Archive]                  │ │
│  └──────────────────────────────────────────────┘ │
│                                                    │
└────────────────────────────────────────────────────┘
```

### 6.2 PROJECT 详情页

```
┌────────────────────────────────────────────────────────────┐
│  ← Back to Projects                                        │
├────────────────────────────────────────────────────────────┤
│  📁 博客网站                                               │
│  🔗 github.com/user/blog-website                           │
│  🟢 In Progress                                            │
├─────────────┬──────────────────────────────────────────────┤
│             │                                              │
│  Overview   │  📊 Project Overview                         │
│  Tasks      │  ──────────────────────────────────          │
│  Timeline   │  • Type: Web Application                     │
│  Context    │  • Tech Stack: Next.js, PostgreSQL, Vercel   │
│  Settings   │  • Started: 2 days ago                       │
│             │  • Progress: 60% (3/5 completed)             │
│             │  • Active Workers: 2                         │
│             │                                              │
│             │  📋 Tasks                                    │
│             │  ──────────────────────────────────          │
│             │  ✅ Task 1: Database Design                  │
│             │     feature/database merged • 3.5h           │
│             │                                              │
│             │  ✅ Task 2: User Authentication              │
│             │     feature/auth merged • 5.2h               │
│             │                                              │
│             │  🔄 Task 4: Comment System                   │
│             │     In Progress • 2.1h / 4-6h                │
│             │     [View Details] [Intervene]               │
│             │                                              │
│             │  ✅ Task 5: Search Feature                   │
│             │     feature/search merged • 6.8h             │
│             │                                              │
│             │  ⏳ Task 3: Article Editor                   │
│             │     Waiting for dependencies                 │
│             │     [Start Now]                              │
│             │                                              │
│             │  🎯 Master Conversation                      │
│             │  ──────────────────────────────────          │
│             │  Mike is coordinating all tasks...           │
│             │  [Open Master Chat]                          │
│             │                                              │
└─────────────┴──────────────────────────────────────────────┘
```

### 6.3 Master Conversation 界面

```
┌────────────────────────────────────────────────────────────┐
│  Master Conversation - 博客网站                            │
│  Mike (Project Manager)                                    │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  💬 Conversation History                                   │
│  ────────────────────────────────────────────────────      │
│                                                            │
│  👤 User (2 days ago):                                     │
│  "创建一个博客网站，需要支持 Markdown 文章发布、           │
│   评论系统、标签分类和全文搜索"                            │
│                                                            │
│  🤖 Mike:                                                  │
│  "我理解了你的需求。让我分析一下项目范围..."              │
│  [展开完整任务拆解方案]                                    │
│                                                            │
│  👤 User:                                                  │
│  "确认并开始"                                              │
│                                                            │
│  🤖 Mike:                                                  │
│  "✅ 所有任务已创建！                                      │
│                                                            │
│   Phase 1: Task 1 已完成 ✅                                │
│   Phase 2: Task 2, 4, 5 执行中...                         │
│           Task 2 已完成 ✅                                 │
│           Task 4 进行中 🔄 (60%)                          │
│           Task 5 已完成 ✅                                 │
│   Phase 3: Task 3 等待中...                                │
│                                                            │
│   [查看详细进度]"                                          │
│                                                            │
│  🔄 Live Status Update (30 seconds ago):                  │
│  ──────────────────────────────────────────────────        │
│  Task 4 update: Alex 正在实现评论 API...                  │
│  预计还需 1.5 小时                                         │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  💬 [Type a message...]                           [Send]   │
└────────────────────────────────────────────────────────────┘
```

### 6.4 Worker Conversation 界面

```
┌────────────────────────────────────────────────────────────┐
│  ← Back to Master          Worker: Comment System          │
├────────────────────────────────────────────────────────────┤
│  📌 Task: 实现博客评论系统                                 │
│  🔗 Branch: feature/comments                               │
│  🔄 Status: In Progress (60%)                              │
│  👥 Team: Emma, Alex                                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  💬 Team Conversation                                      │
│  ────────────────────────────────────────────────────      │
│                                                            │
│  🤖 Emma (Product Manager):                                │
│  "评论系统 PRD 如下：                                      │
│                                                            │
│   核心功能：                                               │
│   • 用户可以对文章发表评论                                 │
│   • 支持嵌套回复（最多 3 层）                              │
│   • 评论审核机制                                           │
│   • 评论点赞功能                                           │
│   • 实时通知                                               │
│                                                            │
│   [查看完整 PRD]"                                          │
│                                                            │
│  🤖 Alex (Engineer):                                       │
│  "收到！我开始实现评论系统...                              │
│                                                            │
│   ✅ 已完成:                                               │
│   • 数据库 schema (comments 表)                            │
│   • Comment model and relations                            │
│   • CRUD API endpoints                                     │
│                                                            │
│   🔄 进行中:                                               │
│   • 嵌套回复逻辑                                           │
│   • 前端评论组件                                           │
│                                                            │
│   ⏳ 待完成:                                               │
│   • 审核系统                                               │
│   • 通知功能                                               │
│                                                            │
│   预计还需 1.5 小时"                                       │
│                                                            │
│  👤 User (介入):                                           │
│  "评论系统不需要嵌套回复，只要一级评论就够了"              │
│                                                            │
│  🤖 Alex:                                                  │
│  "明白了！我会简化评论结构。这样可以节省约 30 分钟...      │
│   正在调整..."                                             │
│                                                            │
├────────────────────────────────────────────────────────────┤
│  💬 [Type a message...]                           [Send]   │
└────────────────────────────────────────────────────────────┘
```

---

## 7. 实现路线图

### Phase 1: 基础架构 (Week 1-2)

#### 任务清单
- [ ] 数据库 schema 设计和 migration
  - [ ] 增强 `projects` 表
  - [ ] 增强 `conversations` 表
  - [ ] 新增 `project_events` 表
  - [ ] 新增 `task_dependencies` 表
- [ ] TypeScript 类型定义更新
- [ ] PROJECT CRUD API
  - [ ] `createProject`
  - [ ] `getProject`
  - [ ] `updateProject`
  - [ ] `deleteProject`
  - [ ] `listUserProjects`
- [ ] Core Context 管理 API
  - [ ] `updateCoreContext`
  - [ ] `getCoreContext`
- [ ] GitHub 集成
  - [ ] Octokit 客户端封装
  - [ ] OAuth 认证流程
  - [ ] 仓库权限验证

### Phase 2: Master-Worker 机制 (Week 3-4)

#### 任务清单
- [ ] MikeAgent 增强
  - [ ] 需求分析逻辑
  - [ ] 任务拆解算法
  - [ ] 任务计划展示
  - [ ] 用户确认流程
- [ ] WorkerOrchestrator
  - [ ] 基础框架
  - [ ] Core Context 加载
  - [ ] 标准工作流执行
- [ ] Conversation 类型管理
  - [ ] Master Conversation 创建
  - [ ] Worker Conversation 创建
  - [ ] 父子关系维护
- [ ] 任务依赖管理
  - [ ] 依赖图构建
  - [ ] 拓扑排序
  - [ ] 依赖检测

### Phase 3: 并行开发支持 (Week 5-6)

#### 任务清单
- [ ] 任务调度器
  - [ ] Phase 划分逻辑
  - [ ] 并行执行控制
  - [ ] 依赖等待机制
- [ ] Git 操作
  - [ ] 分支创建
  - [ ] 代码提交
  - [ ] Pull Request 创建
  - [ ] 分支合并
  - [ ] 冲突检测
- [ ] 进度监控
  - [ ] Worker 状态订阅
  - [ ] 进度计算
  - [ ] 实时更新
- [ ] 失败处理
  - [ ] 失败检测
  - [ ] 原因分析
  - [ ] 解决方案生成
  - [ ] 重试机制

### Phase 4: 用户交互 (Week 7-8)

#### 任务清单
- [ ] PROJECT 列表页
  - [ ] 项目列表展示
  - [ ] 项目创建对话框
  - [ ] 项目状态显示
- [ ] PROJECT 详情页
  - [ ] 项目概览
  - [ ] 任务列表
  - [ ] 时间线视图
  - [ ] Core Context 展示
- [ ] Master Conversation 界面
  - [ ] 任务拆解展示
  - [ ] 用户确认交互
  - [ ] 实时进度更新
- [ ] Worker Conversation 界面
  - [ ] 任务详情展示
  - [ ] 团队对话
  - [ ] 用户介入支持
- [ ] GitHub 集成界面
  - [ ] OAuth 授权流程
  - [ ] 仓库选择器
  - [ ] 分支管理
  - [ ] PR 查看

### Phase 5: 测试与优化 (Week 9-10)

#### 任务清单
- [ ] 单元测试
  - [ ] MikeAgent 测试
  - [ ] WorkerOrchestrator 测试
  - [ ] GitHub 客户端测试
- [ ] 集成测试
  - [ ] 完整流程测试
  - [ ] 并行执行测试
  - [ ] 失败恢复测试
- [ ] 性能优化
  - [ ] 并行度优化
  - [ ] 数据库查询优化
  - [ ] 实时更新优化
- [ ] 文档完善
  - [ ] API 文档
  - [ ] 用户指南
  - [ ] 开发者文档

---

## 8. 关键技术点

### 8.1 任务依赖图算法

```typescript
interface TaskNode {
  id: string;
  conversation: Conversation;
  dependencies: string[];
}

class TaskDependencyGraph {
  private nodes: Map<string, TaskNode>;

  /**
   * 构建依赖图
   */
  build(conversations: Conversation[]): void {
    conversations.forEach(conv => {
      this.nodes.set(conv.id, {
        id: conv.id,
        conversation: conv,
        dependencies: conv.task?.dependencies || []
      });
    });
  }

  /**
   * 拓扑排序，返回执行阶段
   */
  topologicalSort(): TaskNode[][] {
    const phases: TaskNode[][] = [];
    const visited = new Set<string>();
    const inDegree = new Map<string, number>();

    // 计算入度
    this.nodes.forEach(node => {
      inDegree.set(node.id, node.dependencies.length);
    });

    // 按阶段分组
    while (visited.size < this.nodes.size) {
      const currentPhase: TaskNode[] = [];

      // 找到所有入度为 0 的节点（可以并行执行）
      this.nodes.forEach(node => {
        if (!visited.has(node.id) && inDegree.get(node.id) === 0) {
          currentPhase.push(node);
        }
      });

      if (currentPhase.length === 0) {
        throw new Error('Circular dependency detected');
      }

      // 标记为已访问，更新其他节点的入度
      currentPhase.forEach(node => {
        visited.add(node.id);

        this.nodes.forEach(other => {
          if (other.dependencies.includes(node.id)) {
            const degree = inDegree.get(other.id)! - 1;
            inDegree.set(other.id, degree);
          }
        });
      });

      phases.push(currentPhase);
    }

    return phases;
  }

  /**
   * 检测循环依赖
   */
  detectCycles(): boolean {
    try {
      this.topologicalSort();
      return false;
    } catch (error) {
      return true;
    }
  }
}
```

### 8.2 实时进度同步

```typescript
/**
 * 使用 Supabase Realtime 同步 Worker 状态
 */
class ProgressMonitor {
  private supabase: SupabaseClient;
  private projectId: string;

  /**
   * 订阅所有 Worker 的状态变化
   */
  subscribeToWorkers(
    projectId: string,
    onUpdate: (conversation: Conversation) => void
  ): void {
    this.projectId = projectId;

    const channel = this.supabase
      .channel(`project:${projectId}:workers`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `project_id=eq.${projectId}`
        },
        (payload) => {
          const conversation = payload.new as Conversation;

          // 只处理 Worker Conversations
          if (conversation.conversation_type === 'worker') {
            onUpdate(conversation);
          }
        }
      )
      .subscribe();
  }

  /**
   * 计算整体进度
   */
  calculateProgress(workers: Conversation[]): ProjectProgress {
    const total = workers.length;
    const completed = workers.filter(
      w => w.task?.status === 'completed'
    ).length;
    const failed = workers.filter(
      w => w.task?.status === 'failed'
    ).length;
    const inProgress = workers.filter(
      w => w.task?.status === 'in_progress'
    ).length;

    return {
      total_tasks: total,
      completed_tasks: completed,
      failed_tasks: failed,
      in_progress_tasks: inProgress,
      percentage: Math.round((completed / total) * 100)
    };
  }
}
```

### 8.3 冲突检测与解决

```typescript
class ConflictResolver {
  private github: GitHubClient;

  /**
   * 检测 PR 是否有冲突
   */
  async detectConflicts(prNumber: number): Promise<Conflict[]> {
    const hasConflict = await this.github.checkMergeConflicts(prNumber);

    if (!hasConflict) {
      return [];
    }

    // 获取冲突详情
    const files = await this.github.getConflictingFiles(prNumber);

    return files.map(file => ({
      file: file.path,
      conflictingBranches: [file.base_branch, file.head_branch],
      conflictMarkers: this.parseConflictMarkers(file.content)
    }));
  }

  /**
   * 自动解决简单冲突
   */
  async autoResolve(conflict: Conflict): Promise<boolean> {
    // 简单策略：如果冲突区域不重叠，自动合并
    if (this.canAutoResolve(conflict)) {
      await this.mergeNonOverlapping(conflict);
      return true;
    }

    return false;
  }

  /**
   * 通知用户介入
   */
  async requestUserIntervention(conflicts: Conflict[]): Promise<void> {
    const message = `
❌ 检测到合并冲突

以下文件存在冲突：
${conflicts.map(c => `• ${c.file}`).join('\n')}

我尝试了自动解决，但需要你的帮助：

${conflicts.map((c, i) => this.formatConflict(c, i + 1)).join('\n\n')}

请选择解决方案：
[手动解决] [重新拆解任务] [查看详情]`;

    await this.notifyUser(message);
  }
}
```

---

## 9. 安全性考虑

### 9.1 GitHub Token 安全

```typescript
/**
 * 加密存储 GitHub access token
 */
class TokenManager {
  private encryption: EncryptionService;

  async storeToken(userId: string, token: string): Promise<void> {
    // 使用用户特定的密钥加密
    const encrypted = await this.encryption.encrypt(token, userId);

    await supabase
      .from('user_github_tokens')
      .upsert({
        user_id: userId,
        encrypted_token: encrypted,
        updated_at: new Date().toISOString()
      });
  }

  async getToken(userId: string): Promise<string> {
    const { data } = await supabase
      .from('user_github_tokens')
      .select('encrypted_token')
      .eq('user_id', userId)
      .single();

    if (!data) {
      throw new Error('GitHub token not found');
    }

    return await this.encryption.decrypt(data.encrypted_token, userId);
  }
}
```

### 9.2 权限验证

```typescript
/**
 * 验证用户对 PROJECT 的访问权限
 */
async function verifyProjectAccess(
  userId: string,
  projectId: string,
  requiredPermission: 'read' | 'write' | 'admin'
): Promise<boolean> {
  const { data: project } = await supabase
    .from('projects')
    .select('user_id, permission')
    .eq('id', projectId)
    .single();

  if (!project) {
    return false;
  }

  // 项目所有者拥有所有权限
  if (project.user_id === userId) {
    return true;
  }

  // 检查共享权限
  if (project.permission === 'public' && requiredPermission === 'read') {
    return true;
  }

  // TODO: 实现更细粒度的权限控制
  return false;
}
```

---

## 10. 未来扩展

### 10.1 协作功能

- **多用户协作**：支持多个用户共同参与一个 PROJECT
- **角色管理**：Owner, Maintainer, Contributor 等角色
- **实时协作**：多人同时查看和介入 Conversations

### 10.2 高级功能

- **自动部署**：任务完成后自动部署到 Vercel/Netlify
- **CI/CD 集成**：自动运行测试、Lint 检查
- **代码审查**：AI 自动审查 PR，提供改进建议
- **性能监控**：监控部署后的应用性能
- **错误追踪**：集成 Sentry 等错误追踪工具

### 10.3 模板与市场

- **PROJECT 模板**：预设的项目模板（博客、电商、SaaS 等）
- **任务模板**：常见任务的拆解模板
- **分享与克隆**：用户可以分享 PROJECT，其他人可以克隆

---

## 11. 总结

本设计方案提出了一个完整的 PROJECT 概念，核心特性包括：

1. **Master-Worker 模式**：通过 Master Conversation 协调多个 Worker Conversation 并行开发
2. **GitHub 深度集成**：每个 PROJECT 关联 GitHub repo，使用分支管理代码
3. **智能任务拆解**：Mike 自动分析需求并拆解任务，支持用户确认和调整
4. **并行优先执行**：自动检测依赖关系，最大化并行度
5. **用户可介入**：用户可以随时介入任何 Worker Conversation
6. **智能失败处理**：自动分析失败原因，提供解决方案，支持重试

这个方案平衡了自动化和用户控制，既能高效完成复杂项目，又保持了灵活性和透明度。
