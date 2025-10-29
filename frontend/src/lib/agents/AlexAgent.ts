/**
 * Alex Agent - Full-stack Engineer
 * 
 * Responsibilities:
 * - Implement features and write code
 * - Handle frontend and backend development
 * - Deploy applications
 * - Fix bugs and optimize performance
 */

import { BaseAgent } from './BaseAgent';
import {
  AgentMessage,
  AgentRole,
  Task,
  MessageType,
  TaskStatus,
  createAgentMessage,
} from './MessageProtocol';
import type { LLMProvider } from '../llm/LLMProvider';

export class AlexAgent extends BaseAgent {
  constructor(llmProvider: LLMProvider) {
    super({
      role: AgentRole.ALEX,
      name: 'Alex',
      description: 'Full-stack Engineer - Implements features, writes code, and deploys applications',
      systemPrompt: AlexAgent.getSystemPromptText(),
      llmProvider,
    });
  }

  /**
   * Get system prompt for Alex
   */
  private static getSystemPromptText(): string {
    return `You are Alex, a skilled full-stack engineer.

RESPONSIBILITIES:
- Implement features based on requirements
- Write clean, maintainable code
- Handle both frontend and backend development
- Deploy applications
- Fix bugs and optimize performance

TECH STACK:
- Frontend: React, TypeScript, Tailwind CSS, Shadcn UI
- Backend: Supabase, PostgreSQL
- Tools: Git, npm/pnpm

CODING PRINCIPLES:
1. Write clean, readable code
2. Follow TypeScript best practices
3. Use modern React patterns (hooks, functional components)
4. Implement responsive designs
5. Handle errors gracefully
6. Write meaningful comments

When given a task:
1. Analyze the requirements
2. Plan the implementation
3. Write the code
4. Test the functionality
5. Document the changes

Always be practical and deliver working solutions.`;
  }

  /**
   * Process incoming message
   */
  async processMessage(message: AgentMessage): Promise<AgentMessage | null> {
    if (message.type === MessageType.TASK_ASSIGNMENT) {
      this.log('Received task assignment');

      const task = message.metadata?.task as Task;
      if (!task) {
        return createAgentMessage(
          MessageType.TASK_REJECTED,
          'No task information provided',
          this.config.role,
          message.from
        );
      }

      // Accept the task
      this.log(`Accepting task: ${task.title}`);
      return createAgentMessage(
        MessageType.TASK_ACCEPTED,
        `I'll work on: ${task.title}`,
        this.config.role,
        message.from
      );
    }

    return null;
  }

  /**
   * Execute assigned task
   */
  async executeTask(task: Task, onChunk?: (chunk: string) => void): Promise<Task> {
    this.log(`Executing task: ${task.title}`);

    try {
      // Get context from dependencies (Emma's PRD + Bob's Architecture)
      let contextInfo = '';
      if (this.context?.tasks) {
        const dependencyTasks = this.context.tasks.filter(t =>
          task.dependencies?.includes(t.id) && t.status === TaskStatus.COMPLETED
        );

        if (dependencyTasks.length > 0) {
          contextInfo = '\n\n**Context from team:**\n';
          dependencyTasks.forEach(depTask => {
            contextInfo += `\n### ${depTask.title}\n`;
            if (depTask.result?.prd) {
              contextInfo += `**Requirements:**\n${depTask.result.prd}\n`;
            }
            if (depTask.result?.architecture) {
              contextInfo += `**Architecture:**\n${depTask.result.architecture}\n`;
            }
          });
        }
      }

      // Generate implementation plan
      const implementationPrompt = `As a full-stack engineer, implement this task:

Task: ${task.title}
Description: ${task.description}
${contextInfo}

Provide:
1. Implementation approach
2. Key code snippets or pseudocode
3. Testing strategy
4. Deployment considerations

Keep it practical and actionable. If PRD and Architecture are provided above, ensure your implementation follows them closely.`;

      const implementation = onChunk
        ? await this.generateStreamingResponse(implementationPrompt, onChunk)
        : await this.generateResponse(implementationPrompt);

      task.status = TaskStatus.COMPLETED;
      task.result = {
        implementation,
        code: implementation,
        plan: implementation,
        completedAt: new Date().toISOString(),
      };
      task.updatedAt = new Date();

      this.log(`Task completed: ${task.title}`);
      return task;
    } catch (error) {
      this.log(`Task failed: ${(error as Error).message}`, 'error');
      task.status = TaskStatus.FAILED;
      task.error = (error as Error).message;
      task.updatedAt = new Date();
      return task;
    }
  }

  /**
   * Check if Alex can handle this task
   */
  canHandleTask(task: Task): boolean {
    const keywords = [
      'implement', 'code', 'develop', 'build', 'create',
      'frontend', 'backend', 'deploy', 'fix', 'bug'
    ];
    const taskText = `${task.title} ${task.description}`.toLowerCase();
    return keywords.some(keyword => taskText.includes(keyword));
  }
}