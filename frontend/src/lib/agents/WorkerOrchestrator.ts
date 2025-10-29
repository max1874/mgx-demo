/**
 * Worker Orchestrator
 *
 * Simplified orchestrator for Worker Conversation execution
 * Handles the standard workflow and GitHub integration
 */

import type {
  Project,
  Task,
  CoreContext,
  TaskExecutionResult,
} from '@/types/project';
import {
  getCoreContext,
  createProjectEvent,
  getConversationDependencies,
} from '@/lib/api/projects';
import { updateConversation } from '@/lib/api/conversations';
import { GitHubClient, CodeFile } from '@/lib/github/GitHubClient';

export interface WorkerResult {
  prd?: string;
  architecture?: string;
  code: string;
  tests: string[];
  documentation: string;
}

export class WorkerOrchestrator {
  private conversationId: string;
  private task: Task;
  private project: Project;
  private githubClient: GitHubClient | null = null;

  constructor(
    conversationId: string,
    task: Task,
    project: Project,
    githubToken?: string
  ) {
    this.conversationId = conversationId;
    this.task = task;
    this.project = project;

    // Initialize GitHub client
    if (githubToken && project.github_repo_url) {
      try {
        this.githubClient = new GitHubClient(project.github_repo_url, githubToken);
      } catch (error) {
        console.error('Failed to initialize GitHub client:', error);
      }
    }
  }

  /**
   * Execute the Worker task
   */
  async execute(): Promise<TaskExecutionResult | null> {
    try {
      console.log(`🔨 Worker: Executing task "${this.task.title}"`);

      // 1. Check dependencies
      const canStart = await this.checkDependencies();
      if (!canStart) {
        console.log('⏳ Worker: Waiting for dependencies...');
        return null;
      }

      // 2. Load PROJECT Core Context
      const coreContext = await this.loadCoreContext();

      // 3. Update task status to in_progress
      await this.updateTaskStatus('in_progress');

      // 4. Execute workflow (this would integrate with actual agents)
      const result = await this.executeWorkflow(coreContext);

      // 5. Commit code to GitHub
      if (this.githubClient && result.code) {
        await this.commitCode(result);
      }

      // 6. Create Pull Request
      let prUrl: string | null = null;
      if (this.githubClient && result.code) {
        prUrl = await this.createPullRequest(result);
      }

      // 7. Update task status to completed
      await this.updateTaskStatus('completed', result, prUrl);

      // 8. Log event
      await createProjectEvent({
        project_id: this.project.id,
        conversation_id: this.conversationId,
        event_type: 'task_completed',
        metadata: {
          agent_name: this.task.lead_agent,
          message: `Task "${this.task.title}" completed`,
          details: { result },
          severity: 'info',
        },
      });

      console.log(`✅ Worker: Task "${this.task.title}" completed`);

      return {
        conversation_id: this.conversationId,
        task: this.task,
        result,
        pull_request_url: prUrl,
      };
    } catch (error) {
      console.error(`❌ Worker: Task failed:`, error);

      // Update task status to failed
      await this.updateTaskStatus('failed', undefined, undefined, (error as Error).message);

      // Log event
      await createProjectEvent({
        project_id: this.project.id,
        conversation_id: this.conversationId,
        event_type: 'task_failed',
        metadata: {
          agent_name: this.task.lead_agent,
          message: `Task "${this.task.title}" failed`,
          details: { error: (error as Error).message },
          severity: 'error',
        },
      });

      return null;
    }
  }

  /**
   * Check if all dependencies are satisfied
   */
  private async checkDependencies(): Promise<boolean> {
    try {
      const { data: dependencies } = await getConversationDependencies(this.conversationId);

      if (!dependencies || dependencies.length === 0) {
        return true; // No dependencies
      }

      // Check if all dependencies are satisfied
      const unsatisfied = dependencies.filter(dep => !dep.satisfied);

      if (unsatisfied.length > 0) {
        console.log(`⏳ Waiting for ${unsatisfied.length} dependencies...`);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Failed to check dependencies:', error);
      return true; // Proceed if we can't check
    }
  }

  /**
   * Load PROJECT Core Context
   */
  private async loadCoreContext(): Promise<CoreContext | null> {
    try {
      const { data: context, error } = await getCoreContext(this.project.id);

      if (error || !context) {
        console.warn('Failed to load Core Context, proceeding without it');
        return null;
      }

      return context;
    } catch (error) {
      console.error('Error loading Core Context:', error);
      return null;
    }
  }

  /**
   * Execute workflow
   * This is a placeholder - real implementation would use actual agents
   */
  private async executeWorkflow(
    _coreContext: CoreContext | null
  ): Promise<WorkerResult> {
    // Placeholder implementation
    // In real implementation, this would:
    // 1. Call Emma for PRD
    // 2. Call Bob for Architecture
    // 3. Call Alex for Implementation

    return {
      code: `// Implementation for ${this.task.title}\n// TODO: Integrate with actual agents`,
      tests: [],
      documentation: `# ${this.task.title}\n\n${this.task.description}`,
    };
  }

  /**
   * Commit code to GitHub branch
   */
  private async commitCode(result: WorkerResult): Promise<void> {
    if (!this.githubClient) {
      return;
    }

    try {
      const files: CodeFile[] = this.extractCodeFiles(result.code);

      if (files.length === 0) {
        console.log('No code files to commit');
        return;
      }

      await this.githubClient.writeFiles(
        files,
        this.task.github_branch,
        `feat: ${this.task.title}\n\n${this.task.description}`
      );

      await createProjectEvent({
        project_id: this.project.id,
        conversation_id: this.conversationId,
        event_type: 'code_committed',
        metadata: {
          agent_name: this.task.lead_agent,
          message: `Code committed to ${this.task.github_branch}`,
          details: { files: files.map(f => f.path) },
          severity: 'info',
        },
      });

      console.log(`✅ Code committed to ${this.task.github_branch}`);
    } catch (error) {
      console.error('Failed to commit code:', error);
      throw error;
    }
  }

  /**
   * Extract code files from generated code
   */
  private extractCodeFiles(code: string): CodeFile[] {
    const files: CodeFile[] = [];

    // Look for code blocks with file paths
    // Format: ```language // path/to/file.ext
    const fileRegex = /```(\w+)?\s*\/\/\s*(.*?)\n([\s\S]*?)```/g;
    let match;

    while ((match = fileRegex.exec(code)) !== null) {
      const [, , path, content] = match;
      if (path && content) {
        files.push({
          path: path.trim(),
          content: content.trim(),
        });
      }
    }

    return files;
  }

  /**
   * Create Pull Request
   */
  private async createPullRequest(result: WorkerResult): Promise<string | null> {
    if (!this.githubClient) {
      return null;
    }

    try {
      const pr = await this.githubClient.createPullRequest({
        title: this.task.title,
        body: this.formatPRDescription(result),
        head: this.task.github_branch,
        base: this.project.github_branch || 'main',
      });

      await createProjectEvent({
        project_id: this.project.id,
        conversation_id: this.conversationId,
        event_type: 'pr_created',
        metadata: {
          agent_name: this.task.lead_agent,
          message: `PR created: ${pr.title}`,
          details: { pr_url: pr.url, pr_number: pr.number },
          severity: 'info',
        },
      });

      console.log(`✅ Pull Request created: ${pr.url}`);
      return pr.url;
    } catch (error) {
      console.error('Failed to create PR:', error);
      return null;
    }
  }

  /**
   * Format Pull Request description
   */
  private formatPRDescription(result: WorkerResult): string {
    return `## ${this.task.title}

${this.task.description}

### Deliverables
${this.task.deliverables.code_files.map(f => `- ${f}`).join('\n') || '- Code implementation'}

### Team
Lead: ${this.task.lead_agent}
Contributors: ${this.task.assigned_agents.join(', ')}

### Documentation
${result.documentation || 'See code for details'}

---
🤖 Generated by AI Team
`;
  }

  /**
   * Update task status
   */
  private async updateTaskStatus(
    status: 'pending' | 'in_progress' | 'completed' | 'failed',
    result?: WorkerResult,
    prUrl?: string | null,
    _error?: string
  ): Promise<void> {
    try {
      const updatedTask: Partial<Task> = {
        ...this.task,
        status,
        pull_request_url: prUrl || this.task.pull_request_url,
      };

      if (status === 'in_progress') {
        updatedTask.started_at = new Date().toISOString();
      } else if (status === 'completed') {
        updatedTask.completed_at = new Date().toISOString();
        updatedTask.actual_time = this.calculateActualTime(this.task.started_at);
        if (result) {
          updatedTask.deliverables = {
            ...this.task.deliverables,
            code_files: result.code ? ['Implementation complete'] : [],
            documentation: result.documentation || '',
          };
        }
      }

      await updateConversation(this.conversationId, {
        task: updatedTask as any,
      });

      console.log(`✅ Task status updated to: ${status}`);
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  }

  /**
   * Calculate actual time taken
   */
  private calculateActualTime(startedAt: string | null): string {
    if (!startedAt) {
      return 'N/A';
    }

    const start = new Date(startedAt);
    const end = new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${diffHours}h ${diffMins}m`;
  }
}
