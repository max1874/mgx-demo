/**
 * Alex Agent - Full-stack Engineer
 * 
 * Alex is responsible for:
 * - Implementing frontend and backend code
 * - Building web applications, games, dashboards
 * - Writing clean, maintainable code
 * - Following best practices and design patterns
 * - Testing and debugging
 */

import { BaseAgent, AgentConfig } from './BaseAgent';
import {
  AgentMessage,
  AgentRole,
  Task,
  MessageType,
  TaskStatus,
} from './MessageProtocol';

const ALEX_SYSTEM_PROMPT = `You are Alex, a skilled Full-stack Engineer with expertise in modern web development.

Your technical skills:
- Frontend: React, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Node.js, Express, Supabase
- Databases: PostgreSQL, Supabase
- Tools: Git, VS Code, Chrome DevTools

Your responsibilities:
1. Implement features based on requirements and designs
2. Write clean, maintainable, and well-documented code
3. Follow best practices and coding standards
4. Test your code thoroughly
5. Debug and fix issues
6. Optimize performance

Your approach to coding:
- Start with a clear understanding of requirements
- Break down complex features into smaller components
- Write modular, reusable code
- Use TypeScript for type safety
- Follow React best practices (hooks, component composition)
- Use Tailwind CSS and shadcn/ui for styling
- Implement responsive designs
- Handle errors gracefully
- Write meaningful comments for complex logic

When implementing a feature:
1. Analyze the requirements
2. Plan the component structure
3. Identify required dependencies
4. Write the code incrementally
5. Test as you go
6. Refactor for clarity and performance

Code style guidelines:
- Use functional components with hooks
- Prefer composition over inheritance
- Keep components small and focused
- Use meaningful variable and function names
- Add JSDoc comments for complex functions
- Handle loading and error states
- Implement proper TypeScript types

Remember: Write code that you'd be proud to review. Quality over speed.`;

export class AlexAgent extends BaseAgent {
  constructor(llmProvider: any) {
    const config: AgentConfig = {
      role: AgentRole.ALEX,
      name: 'Alex',
      description: 'Full-stack Engineer - Implements and deploys applications',
      systemPrompt: ALEX_SYSTEM_PROMPT,
      llmProvider,
    };
    super(config);
  }

  async processMessage(message: AgentMessage): Promise<AgentMessage | null> {
    this.log(`Processing message: ${message.type} from ${message.from}`);

    // Handle task assignments
    if (message.type === MessageType.TASK_ASSIGNMENT && message.to === this.config.role) {
      return await this.handleTaskAssignment(message);
    }

    // Handle questions or clarifications
    if (message.type === MessageType.AGENT_MESSAGE && message.to === this.config.role) {
      return await this.handleMessage(message);
    }

    return null;
  }

  async executeTask(task: Task): Promise<Task> {
    this.log(`Executing task: ${task.title}`);

    try {
      // Notify that work has started
      this.sendMessage(
        MessageType.AGENT_MESSAGE,
        `Starting work on: ${task.title}`,
        AgentRole.MIKE
      );

      // Generate implementation plan
      const plan = await this.createImplementationPlan(task);
      
      // Generate code
      const code = await this.generateCode(task, plan);

      // Return completed task with code
      return this.updateTask(task, TaskStatus.COMPLETED, { plan, code });
    } catch (error) {
      this.log(`Task execution failed: ${error}`, 'error');
      
      // Ask for clarification if needed
      this.sendMessage(
        MessageType.AGENT_QUESTION,
        `I encountered an issue implementing "${task.title}": ${error}. Could you provide more details?`,
        AgentRole.MIKE
      );

      return this.updateTask(task, TaskStatus.FAILED, undefined, String(error));
    }
  }

  canHandleTask(task: Task): boolean {
    // Alex handles implementation, coding, and development tasks
    const keywords = [
      'implement', 'code', 'develop', 'build', 'create',
      'frontend', 'backend', 'web', 'app', 'component',
      'api', 'database', 'ui', 'interface'
    ];
    
    return keywords.some(keyword => 
      task.title.toLowerCase().includes(keyword) ||
      task.description.toLowerCase().includes(keyword)
    );
  }

  /**
   * Handle task assignment from Mike
   */
  private async handleTaskAssignment(message: AgentMessage): Promise<AgentMessage> {
    this.log('Received task assignment');

    const task = message.metadata?.task as Task;
    
    if (!task) {
      return this.sendMessage(
        MessageType.TASK_REJECTED,
        'No task details provided',
        message.from
      );
    }

    // Check if I can handle this task
    if (!this.canHandleTask(task)) {
      return this.sendMessage(
        MessageType.TASK_REJECTED,
        `This task seems outside my expertise. Perhaps ${this.suggestBetterAgent(task)} would be better suited?`,
        message.from
      );
    }

    // Accept the task
    return this.sendMessage(
      MessageType.TASK_ACCEPTED,
      `I'll start working on "${task.title}" right away.`,
      message.from,
      { taskId: task.id }
    );
  }

  /**
   * Handle general messages
   */
  private async handleMessage(message: AgentMessage): Promise<AgentMessage> {
    const response = await this.generateResponse(
      message.content,
      this.context?.messages
    );

    return this.sendMessage(
      MessageType.AGENT_RESPONSE,
      response,
      message.from
    );
  }

  /**
   * Create implementation plan
   */
  private async createImplementationPlan(task: Task): Promise<string> {
    const prompt = `Create a detailed implementation plan for this task:

Task: ${task.title}
Description: ${task.description}

Please provide:
1. Component structure
2. Required dependencies
3. Key functions/hooks needed
4. Implementation steps
5. Testing approach

Be specific and technical.`;

    return await this.generateResponse(prompt);
  }

  /**
   * Generate code for the task
   */
  private async generateCode(task: Task, plan: string): Promise<string> {
    const prompt = `Generate production-ready code for this task:

Task: ${task.title}
Description: ${task.description}

Implementation Plan:
${plan}

Requirements:
- Use React with TypeScript
- Use Tailwind CSS and shadcn/ui components
- Follow best practices
- Include proper error handling
- Add TypeScript types
- Write clean, maintainable code

Provide the complete code with explanatory comments.`;

    return await this.generateResponse(prompt);
  }

  /**
   * Suggest a better agent for the task
   */
  private suggestBetterAgent(task: Task): string {
    const description = task.description.toLowerCase();
    
    if (description.includes('requirements') || description.includes('prd')) {
      return 'Emma (Product Manager)';
    }
    if (description.includes('architecture') || description.includes('design')) {
      return 'Bob (System Architect)';
    }
    if (description.includes('data') || description.includes('analysis')) {
      return 'David (Data Analyst)';
    }
    if (description.includes('research') || description.includes('report')) {
      return 'Mike (Team Leader)';
    }
    
    return 'another team member';
  }

  /**
   * Generate streaming code implementation
   */
  async generateCodeStreaming(
    task: Task,
    onChunk: (content: string) => void
  ): Promise<void> {
    const prompt = `Generate production-ready code for this task:

Task: ${task.title}
Description: ${task.description}

Requirements:
- Use React with TypeScript
- Use Tailwind CSS and shadcn/ui components
- Follow best practices
- Include proper error handling
- Add TypeScript types
- Write clean, maintainable code

Provide the complete code with explanatory comments.`;

    await this.generateStreamingResponse(prompt, onChunk, this.context?.messages);
  }
}
