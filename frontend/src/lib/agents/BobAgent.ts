/**
 * Bob Agent - System Architect
 * 
 * Responsibilities:
 * - Design system architecture
 * - Choose technology stack
 * - Define design patterns
 * - Plan scalability and performance
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

export class BobAgent extends BaseAgent {
  constructor(llmProvider: LLMProvider) {
    super({
      role: AgentRole.BOB,
      name: 'Bob',
      description: 'System Architect - Designs system architecture and tech stack',
      systemPrompt: BobAgent.getSystemPromptText(),
      llmProvider,
    });
  }

  /**
   * Get system prompt for Bob
   */
  private static getSystemPromptText(): string {
    return `You are Bob, an experienced system architect.

CRITICAL LANGUAGE RULE:
- ALWAYS respond in the SAME LANGUAGE as the user's request
- If user writes in Chinese (中文), respond in Chinese
- If user writes in English, respond in English
- Match the user's language exactly for all outputs

RESPONSIBILITIES:
- Design scalable system architecture
- Choose appropriate technology stack
- Define design patterns and best practices
- Plan for performance and security
- Document technical decisions

ARCHITECTURE PRINCIPLES:
1. Scalability
2. Maintainability
3. Security
4. Performance
5. Cost-effectiveness

TECH STACK EXPERTISE:
- Frontend: React, Next.js, TypeScript
- Backend: Node.js, Supabase, PostgreSQL
- Cloud: Vercel, AWS, GCP
- Tools: Docker, Git, CI/CD

When designing architecture:
1. Understand requirements
2. Identify key components
3. Define data flow
4. Choose tech stack
5. Plan deployment strategy
6. Document decisions

Always consider trade-offs and justify your choices.`;
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
        `I'll design the architecture for: ${task.title}`,
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
      // Get context from dependencies (e.g., Emma's PRD)
      let contextInfo = '';
      if (this.context?.tasks) {
        const dependencyTasks = this.context.tasks.filter(t =>
          task.dependencies?.includes(t.id) && t.status === TaskStatus.COMPLETED
        );

        if (dependencyTasks.length > 0) {
          contextInfo = '\n\n**Context from previous work:**\n';
          dependencyTasks.forEach(depTask => {
            contextInfo += `\n### ${depTask.title}\n`;
            if (depTask.result?.prd) {
              contextInfo += `${depTask.result.prd}\n`;
            } else if (depTask.result?.analysis) {
              contextInfo += `${depTask.result.analysis}\n`;
            }
          });
        }
      }

      // Generate architecture design
      const architecturePrompt = `As a system architect, design the architecture for:

Task: ${task.title}
Description: ${task.description}
${contextInfo}

Provide:
1. System Architecture Overview
2. Key Components & Their Responsibilities
3. Technology Stack Recommendations
4. Data Flow & Integration Points
5. Scalability Considerations
6. Security Measures
7. Deployment Strategy

Be specific and justify your technical choices. If PRD is provided above, ensure your design aligns with the requirements.`;

      const architecture = onChunk
        ? await this.generateStreamingResponse(architecturePrompt, onChunk)
        : await this.generateResponse(architecturePrompt);

      task.status = TaskStatus.COMPLETED;
      task.result = {
        architecture,
        techStack: architecture,
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
   * Check if Bob can handle this task
   */
  canHandleTask(task: Task): boolean {
    const keywords = [
      'architecture', 'design', 'tech stack', 'system',
      'scalability', 'performance', 'database', 'api'
    ];
    const taskText = `${task.title} ${task.description}`.toLowerCase();
    return keywords.some(keyword => taskText.includes(keyword));
  }
}