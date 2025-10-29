/**
 * Mike Master Agent - PROJECT Coordinator
 *
 * Enhanced version of MikeAgent for Master Conversation in PROJECT mode
 * Responsibilities:
 * - Analyze project requirements
 * - Decompose project into tasks
 * - Create Worker Conversations
 * - Monitor progress
 * - Handle failures and conflicts
 * - Integrate results
 */

import { BaseAgent } from './BaseAgent';
import {
  AgentMessage,
  AgentRole,
  MessageType,
  createAgentMessage,
} from './MessageProtocol';
import type { LLMProvider } from '../llm/LLMProvider';
import type {
  Project,
  Task,
  TaskPlan,
  TaskPlanItem,
  CoreContext,
  Conversation,
} from '@/types/project';
import {
  createConversation,
} from '@/lib/api/conversations';
import {
  updateCoreContext,
  createProjectEvent,
  createTaskDependency,
  updateProjectProgress,
} from '@/lib/api/projects';
import { GitHubClient } from '@/lib/github/GitHubClient';

export class MikeMasterAgent extends BaseAgent {
  private project: Project;
  private githubClient: GitHubClient | null = null;

  constructor(llmProvider: LLMProvider, project: Project, githubToken?: string) {
    super({
      role: AgentRole.MIKE,
      name: 'Mike',
      description: 'Master Agent - PROJECT Coordinator and Task Orchestrator',
      systemPrompt: MikeMasterAgent.getSystemPromptText(),
      llmProvider,
    });

    this.project = project;

    // Initialize GitHub client if we have a token and repo
    if (githubToken && project.github_repo_url) {
      try {
        this.githubClient = new GitHubClient(project.github_repo_url, githubToken);
      } catch (error) {
        console.error('Failed to initialize GitHub client:', error);
      }
    }
  }

  /**
   * Get system prompt for Master mode
   */
  private static getSystemPromptText(): string {
    return `You are Mike, a senior project manager and technical architect.

CRITICAL LANGUAGE RULE:
- ALWAYS respond in the SAME LANGUAGE as the user's request
- If user writes in Chinese (中文), respond in Chinese
- If user writes in English, respond in English

YOUR ROLE IN PROJECT MODE:
You are the Master Coordinator for a software development PROJECT. Your job is to:
1. Analyze project requirements deeply
2. Break down the project into manageable, parallelizable tasks
3. Create Worker Conversations for each task
4. Monitor progress and handle issues
5. Integrate all results into a cohesive deliverable

YOUR TEAM:
- Emma (Product Manager): Requirements analysis, PRD creation
- Bob (System Architect): System design, architecture, tech stack selection
- Alex (Full-stack Engineer): Code implementation, deployment
- David (Data Analyst): Data processing, analysis, visualization
- Iris (Research Specialist): Deep research, report generation

TASK DECOMPOSITION PRINCIPLES:
1. Break projects into independent, cohesive modules
2. Identify dependencies clearly
3. Maximize parallelization opportunities
4. Ensure each task has clear deliverables
5. Assign appropriate agents based on expertise
6. Estimate time realistically

DEPENDENCIES:
- "blocks": Task B cannot start until Task A completes (sequential)
- "requires": Task B needs Task A's output but can start (reference)
- "optional": Tasks can run completely in parallel

TECH STACK RECOMMENDATIONS:
Consider project type and requirements:
- Web: Next.js, React, Tailwind CSS, Supabase, Vercel
- Mobile: React Native, Expo
- Data: Python, Pandas, Jupyter, Plotly
- API: Node.js, Express, PostgreSQL

OUTPUT FORMAT:
When analyzing a project request, respond with:
{
  "analysis": {
    "project_type": "web" | "mobile" | "data" | "slides" | "custom",
    "summary": "Brief project description",
    "core_features": ["feature1", "feature2"],
    "tech_stack": {
      "frontend": ["Next.js", "React"],
      "backend": ["Node.js", "PostgreSQL"],
      "infrastructure": ["Vercel", "Supabase"],
      "tools": ["Git", "ESLint"]
    },
    "complexity": "low" | "medium" | "high",
    "estimated_total_time": "12-16 hours"
  },
  "tasks": [
    {
      "title": "Task title",
      "description": "Detailed description",
      "priority": "high" | "medium" | "low",
      "agents": ["Emma", "Bob", "Alex"],
      "lead_agent": "Alex",
      "dependencies": [], // task titles this depends on
      "branch": "feature/task-name",
      "estimated_time": "4-6 hours",
      "deliverables": ["Code files", "Documentation"]
    }
  ],
  "execution_plan": {
    "phase_1": ["Task 1"],
    "phase_2": ["Task 2", "Task 3"], // parallel
    "phase_3": ["Task 4"]
  },
  "estimated_parallel_time": "8-12 hours",
  "estimated_serial_time": "20-28 hours"
}

Be specific, practical, and realistic in your task breakdown.`;
  }

  /**
   * Process PROJECT-level user request in Master Conversation
   */
  async processProjectRequest(
    userMessage: string,
    onChunk?: (chunk: string) => void
  ): Promise<TaskPlan | null> {
    try {
      this.log('Processing PROJECT request in Master mode');

      // 1. Analyze requirements
      const analysis = await this.analyzeProjectRequirements(userMessage, onChunk);

      if (!analysis) {
        throw new Error('Failed to analyze project requirements');
      }

      // 2. Update Core Context with analysis
      await this.updateProjectContext(analysis);

      // 3. Present task plan to user for confirmation
      await this.presentTaskPlan(analysis, onChunk);

      return analysis;
    } catch (error) {
      this.log(`Error processing PROJECT request: ${(error as Error).message}`, 'error');
      return null;
    }
  }

  /**
   * Analyze project requirements and create task plan
   */
  private async analyzeProjectRequirements(
    userMessage: string,
    _onChunk?: (chunk: string) => void
  ): Promise<TaskPlan | null> {
    try {
      const prompt = `Analyze this project request and create a detailed task breakdown:

User Request: "${userMessage}"

Project Context:
- Name: ${this.project.name}
- Type: ${this.project.project_type || 'not specified'}
- Description: ${this.project.description || 'none'}

Provide a comprehensive analysis and task decomposition following the output format specified in your instructions.`;

      this.log('Asking LLM to analyze project...');

      const response = await this.generateResponse(prompt);

      // Parse response
      let parsed: any;
      try {
        parsed = JSON.parse(response);
      } catch (e) {
        // Try to extract JSON from markdown code blocks
        const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[1]);
        } else {
          throw new Error('Failed to parse analysis JSON');
        }
      }

      // Validate structure
      if (!parsed.analysis || !parsed.tasks) {
        throw new Error('Invalid analysis structure');
      }

      const taskPlan: TaskPlan = {
        analysis: {
          project_type: parsed.analysis.project_type || this.project.project_type || 'web',
          core_features: parsed.analysis.core_features || [],
          tech_stack: parsed.analysis.tech_stack || {},
          architecture: parsed.analysis.summary || '',
          coding_standards: parsed.analysis.coding_standards || [],
        },
        tasks: parsed.tasks.map((t: any) => ({
          title: t.title,
          description: t.description,
          priority: t.priority || 'medium',
          agents: t.agents || [],
          lead_agent: t.lead_agent,
          dependencies: t.dependencies || [],
          branch: t.branch || `feature/${t.title.toLowerCase().replace(/\s+/g, '-')}`,
          estimated_time: t.estimated_time || 'TBD',
          deliverables: t.deliverables || [],
        })),
        estimated_parallel_time: parsed.estimated_parallel_time || 'TBD',
        estimated_serial_time: parsed.estimated_serial_time || 'TBD',
      };

      this.log('Successfully analyzed project requirements');
      return taskPlan;
    } catch (error) {
      this.log(`Failed to analyze requirements: ${(error as Error).message}`, 'error');
      return null;
    }
  }

  /**
   * Update PROJECT Core Context with analysis
   */
  private async updateProjectContext(taskPlan: TaskPlan): Promise<void> {
    try {
      const coreContext: Partial<CoreContext> = {
        tech_stack: taskPlan.analysis.tech_stack,
        requirements: {
          summary: taskPlan.analysis.architecture,
          goals: taskPlan.analysis.core_features,
          user_stories: [],
          features: taskPlan.analysis.core_features,
          constraints: [],
        },
        architecture: {
          system_design: '',
          database_schema: {},
          api_design: {},
          component_hierarchy: {},
        },
        file_structure: {},
        coding_standards: {
          style_guide: '',
          naming_conventions: {},
          best_practices: taskPlan.analysis.coding_standards,
        },
      };

      await updateCoreContext(this.project.id, coreContext);

      await createProjectEvent({
        project_id: this.project.id,
        conversation_id: this.context?.conversationId,
        event_type: 'context_updated',
        metadata: {
          agent_name: 'Mike',
          message: 'Project context updated with analysis',
          severity: 'info',
        },
      });

      this.log('Updated PROJECT Core Context');
    } catch (error) {
      this.log(`Failed to update context: ${(error as Error).message}`, 'error');
    }
  }

  /**
   * Present task plan to user for confirmation
   */
  private async presentTaskPlan(
    taskPlan: TaskPlan,
    onChunk?: (chunk: string) => void
  ): Promise<void> {
    const presentation = this.formatTaskPlanPresentation(taskPlan);

    if (onChunk) {
      // Stream the presentation
      for (let i = 0; i < presentation.length; i++) {
        onChunk(presentation[i]);
        await new Promise(resolve => setTimeout(resolve, 5));
      }
    }
  }

  /**
   * Format task plan as presentable text
   */
  private formatTaskPlanPresentation(taskPlan: TaskPlan): string {
    let text = `📋 项目分析
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
项目类型：${taskPlan.analysis.project_type}
核心功能：
`;

    taskPlan.analysis.core_features.forEach(feature => {
      text += `  • ${feature}\n`;
    });

    text += `\n推荐技术栈：\n`;
    if (taskPlan.analysis.tech_stack.frontend) {
      text += `  • Frontend: ${taskPlan.analysis.tech_stack.frontend.join(', ')}\n`;
    }
    if (taskPlan.analysis.tech_stack.backend) {
      text += `  • Backend: ${taskPlan.analysis.tech_stack.backend.join(', ')}\n`;
    }
    if (taskPlan.analysis.tech_stack.infrastructure) {
      text += `  • Infrastructure: ${taskPlan.analysis.tech_stack.infrastructure.join(', ')}\n`;
    }

    text += `\n📦 任务拆解
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

我建议将项目拆解为以下 ${taskPlan.tasks.length} 个任务：\n\n`;

    taskPlan.tasks.forEach((task, index) => {
      text += `┌────────────────────────────────────────┐\n`;
      text += `│ Task ${index + 1}: ${task.title}\n`;
      text += `├────────────────────────────────────────┤\n`;
      text += `│ 负责人: ${task.lead_agent} (${task.agents.join(', ')})\n`;
      text += `│ 分支: ${task.branch}\n`;
      text += `│ 预计: ${task.estimated_time}\n`;
      text += `│\n`;
      text += `│ 描述:\n`;
      text += `│ ${task.description}\n`;
      text += `│\n`;
      text += `│ 产出:\n`;
      task.deliverables.forEach(d => {
        text += `│ • ${d}\n`;
      });
      if (task.dependencies.length > 0) {
        text += `│\n│ 依赖: ${task.dependencies.join(', ')}\n`;
      } else {
        text += `│\n│ 依赖: 无\n`;
      }
      text += `└────────────────────────────────────────┘\n\n`;
    });

    text += `⚡ 并行执行计划
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
预计并行耗时: ${taskPlan.estimated_parallel_time}
预计串行耗时: ${taskPlan.estimated_serial_time}

是否确认此拆解方案？`;

    return text;
  }

  /**
   * Execute task (required by BaseAgent)
   */
  async executeTask(task: any, _onChunk?: (chunk: string) => void): Promise<any> {
    // Mike coordinates but doesn't execute tasks directly
    task.status = 'completed';
    task.result = {
      coordination: 'Task delegated to Worker Conversations',
      completedAt: new Date().toISOString(),
    };
    task.updatedAt = new Date();
    return task;
  }

  /**
   * Check if Mike can handle this task (required by BaseAgent)
   */
  canHandleTask(_task: any): boolean {
    // Mike handles all coordination and planning tasks
    return true;
  }

  /**
   * Execute task plan - create Worker Conversations
   */
  async executeTaskPlan(taskPlan: TaskPlan): Promise<any[]> {
    try {
      this.log('Creating Worker Conversations for tasks...');

      const workerConversations: Conversation[] = [];

      // Create all Worker Conversations
      for (const task of taskPlan.tasks) {
        const worker = await this.createWorkerConversation(task);
        if (worker) {
          workerConversations.push(worker);
        }
      }

      // Create task dependencies
      await this.createTaskDependencies(workerConversations, taskPlan);

      // Create GitHub branches for each task
      if (this.githubClient) {
        await this.createGitBranches(taskPlan.tasks);
      }

      // Update project status
      await updateProjectProgress(this.project.id, {
        total_tasks: taskPlan.tasks.length,
        completed_tasks: 0,
        failed_tasks: 0,
        in_progress_tasks: 0,
        percentage: 0,
      });

      this.log(`Created ${workerConversations.length} Worker Conversations`);
      return workerConversations;
    } catch (error) {
      this.log(`Failed to execute task plan: ${(error as Error).message}`, 'error');
      return [];
    }
  }

  /**
   * Create a Worker Conversation for a task
   */
  private async createWorkerConversation(task: TaskPlanItem): Promise<Conversation | null> {
    try {
      const taskData: Task = {
        title: task.title,
        description: task.description,
        priority: task.priority,
        assigned_agents: task.agents,
        lead_agent: task.lead_agent,
        dependencies: [], // Will be filled by IDs later
        blocked_by: [],
        blocks: [],
        github_branch: task.branch,
        pull_request_url: null,
        status: 'pending',
        deliverables: {
          code_files: [],
          documentation: '',
          test_coverage: 0,
          deployment_url: null,
        },
        estimated_time: task.estimated_time,
        actual_time: null,
        started_at: null,
        completed_at: null,
      };

      const { data: conversation, error } = await createConversation({
        project_id: this.project.id,
        user_id: this.project.user_id,
        conversation_type: 'worker',
        parent_conversation_id: this.context?.conversationId || null,
        task: taskData as any,
        mode: 'team',
        title: `Worker: ${task.title}`,
      });

      if (error || !conversation) {
        throw error || new Error('Failed to create conversation');
      }

      // Log event
      await createProjectEvent({
        project_id: this.project.id,
        conversation_id: conversation.id,
        event_type: 'task_created',
        metadata: {
          agent_name: 'Mike',
          message: `Task "${task.title}" created`,
          details: { task },
          severity: 'info',
        },
      });

      this.log(`Created Worker Conversation: ${task.title}`);
      return conversation;
    } catch (error) {
      this.log(`Failed to create Worker for ${task.title}: ${(error as Error).message}`, 'error');
      return null;
    }
  }

  /**
   * Create task dependencies in database
   */
  private async createTaskDependencies(
    workers: Conversation[],
    taskPlan: TaskPlan
  ): Promise<void> {
    try {
      // Build a map of task title to conversation ID
      const taskMap = new Map<string, string>();
      workers.forEach(worker => {
        const task = worker.task as any;
        if (task && task.title) {
          taskMap.set(task.title, worker.id);
        }
      });

      // Create dependencies
      for (let i = 0; i < taskPlan.tasks.length; i++) {
        const task = taskPlan.tasks[i];
        const conversationId = taskMap.get(task.title);

        if (!conversationId || !task.dependencies || task.dependencies.length === 0) {
          continue;
        }

        for (const depTitle of task.dependencies) {
          const depConversationId = taskMap.get(depTitle);

          if (depConversationId) {
            await createTaskDependency({
              project_id: this.project.id,
              dependent_conversation_id: conversationId,
              dependency_conversation_id: depConversationId,
              dependency_type: 'blocks',
              description: `${task.title} depends on ${depTitle}`,
            });

            this.log(`Created dependency: ${task.title} -> ${depTitle}`);
          }
        }
      }
    } catch (error) {
      this.log(`Failed to create dependencies: ${(error as Error).message}`, 'error');
    }
  }

  /**
   * Create GitHub branches for tasks
   */
  private async createGitBranches(tasks: TaskPlanItem[]): Promise<void> {
    if (!this.githubClient) {
      return;
    }

    try {
      const baseBranch = this.project.github_branch || 'main';

      for (const task of tasks) {
        try {
          await this.githubClient.createBranch(task.branch, baseBranch);
          this.log(`Created branch: ${task.branch}`);
        } catch (error) {
          this.log(`Failed to create branch ${task.branch}: ${(error as Error).message}`, 'error');
        }
      }
    } catch (error) {
      this.log(`Failed to create GitHub branches: ${(error as Error).message}`, 'error');
    }
  }

  /**
   * Process message with streaming
   */
  async processMessageStreaming(
    message: AgentMessage,
    onChunk: (chunk: string) => void
  ): Promise<AgentMessage | null> {
    if (message.type !== MessageType.USER_REQUEST) {
      return null;
    }

    const taskPlan = await this.processProjectRequest(message.content, onChunk);

    if (!taskPlan) {
      return createAgentMessage(
        MessageType.AGENT_RESPONSE,
        '抱歉，我无法分析这个项目需求。请提供更多详细信息。',
        this.config.role,
        AgentRole.USER
      );
    }

    return createAgentMessage(
      MessageType.AGENT_RESPONSE,
      'Task plan presented',
      this.config.role,
      AgentRole.USER,
      { taskPlan }
    );
  }

  /**
   * Process message (non-streaming)
   */
  async processMessage(message: AgentMessage): Promise<AgentMessage | null> {
    return this.processMessageStreaming(message, () => {});
  }
}
