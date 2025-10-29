/**
 * Emma Agent - Product Manager
 * 
 * Responsibilities:
 * - Analyze user requirements
 * - Create Product Requirement Documents (PRD)
 * - Define user stories and acceptance criteria
 * - Conduct market research
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

export class EmmaAgent extends BaseAgent {
  constructor(llmProvider: LLMProvider) {
    super({
      role: AgentRole.EMMA,
      name: 'Emma',
      description: 'Product Manager - Analyzes requirements and creates PRDs',
      systemPrompt: EmmaAgent.getSystemPromptText(),
      llmProvider,
    });
  }

  /**
   * Get system prompt for Emma
   */
  private static getSystemPromptText(): string {
    return `You are Emma, an experienced product manager.

RESPONSIBILITIES:
- Analyze user requirements and needs
- Create comprehensive Product Requirement Documents (PRD)
- Define user stories and acceptance criteria
- Conduct market research and competitive analysis
- Prioritize features based on user value

PRD STRUCTURE:
1. Overview & Goals
2. User Personas
3. User Stories
4. Functional Requirements
5. Non-functional Requirements
6. Success Metrics
7. Timeline & Milestones

PRINCIPLES:
- User-centric thinking
- Data-driven decisions
- Clear communication
- Iterative refinement

When creating a PRD:
1. Understand the problem
2. Define target users
3. List key features
4. Set success criteria
5. Estimate timeline

Always focus on delivering value to users.`;
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
        `I'll analyze the requirements and create a PRD for: ${task.title}`,
        this.config.role,
        message.from
      );
    }

    return null;
  }

  /**
   * Execute assigned task
   */
  async executeTask(task: Task): Promise<Task> {
    this.log(`Executing task: ${task.title}`);

    try {
      // Generate PRD
      const prdPrompt = `As a product manager, create a comprehensive PRD for:

Task: ${task.title}
Description: ${task.description}

Include:
1. Product Overview & Goals
2. Target Users
3. Key Features (prioritized)
4. User Stories
5. Success Metrics
6. Timeline

Format it clearly and professionally.`;

      const prd = await this.generateResponse(prdPrompt);

      task.status = TaskStatus.COMPLETED;
      task.result = {
        prd,
        analysis: prd,
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
   * Check if Emma can handle this task
   */
  canHandleTask(task: Task): boolean {
    const keywords = [
      'requirements', 'prd', 'analysis', 'user story',
      'research', 'market', 'competitive', 'product'
    ];
    const taskText = `${task.title} ${task.description}`.toLowerCase();
    return keywords.some(keyword => taskText.includes(keyword));
  }
}