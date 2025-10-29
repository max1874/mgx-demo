/**
 * Agent Orchestrator
 * 
 * Manages agent lifecycle, task routing, and coordination.
 * This is the central hub that receives user requests and orchestrates
 * the collaboration between different agents.
 */

import { MikeAgent } from './MikeAgent';
import { AlexAgent } from './AlexAgent';
import { BaseAgent } from './BaseAgent';
import {
  AgentMessage,
  AgentRole,
  Task,
  MessageType,
  TaskStatus,
  createAgentMessage,
} from './MessageProtocol';
import { LLMProvider } from '../llm/LLMProvider';
import { OpenAIProvider } from '../llm/OpenAIProvider';
import { ClaudeProvider } from '../llm/ClaudeProvider';
import { OpenRouterProvider } from '../llm/OpenRouterProvider';
import { createMessage } from '../api/messages';
import { touchConversation } from '../api/conversations';

interface OrchestratorConfig {
  conversationId: string;
  llmProvider?: 'openai' | 'claude' | 'openrouter';
  onAgentMessage?: (agentName: string, content: string) => void;
  onStreamChunk?: (agentName: string, chunk: string) => void;
  onTaskUpdate?: (task: Task) => void;
  onError?: (error: Error) => void;
}

export class AgentOrchestrator {
  private conversationId: string;
  private agents: Map<AgentRole, BaseAgent>;
  private llmProvider: LLMProvider;
  private messageHistory: AgentMessage[] = [];
  private activeTasks: Map<string, Task> = new Map();
  private config: OrchestratorConfig;

  constructor(config: OrchestratorConfig) {
    this.config = config;
    this.conversationId = config.conversationId;

    // Initialize LLM provider
    const providerType = config.llmProvider || 
      (import.meta.env.VITE_DEFAULT_LLM_PROVIDER as 'openai' | 'claude' | 'openrouter') || 
      'openrouter';
    
    this.llmProvider = this.createLLMProvider(providerType);

    // Initialize agents
    this.agents = new Map();
    this.agents.set(AgentRole.MIKE, new MikeAgent(this.llmProvider));
    this.agents.set(AgentRole.ALEX, new AlexAgent(this.llmProvider));
    // TODO: Add Emma, Bob, David when implemented
  }

  /**
   * Create LLM provider based on type
   */
  private createLLMProvider(type: 'openai' | 'claude' | 'openrouter'): LLMProvider {
    // Priority: OpenRouter > Claude > OpenAI
    if (type === 'openrouter' || !type) {
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
      if (apiKey) {
        const model = import.meta.env.VITE_OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet';
        console.log('Using OpenRouter provider with model:', model);
        return new OpenRouterProvider(apiKey, model);
      }
    }

    if (type === 'claude') {
      const apiKey = import.meta.env.VITE_CLAUDE_API_KEY;
      if (apiKey) {
        console.log('Using Claude provider');
        return new ClaudeProvider(apiKey);
      }
    }

    if (type === 'openai') {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (apiKey) {
        console.log('Using OpenAI provider');
        return new OpenAIProvider(apiKey);
      }
    }

    // Fallback: try any available provider
    const openrouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (openrouterKey) {
      console.warn('Falling back to OpenRouter provider');
      return new OpenRouterProvider(openrouterKey);
    }

    const claudeKey = import.meta.env.VITE_CLAUDE_API_KEY;
    if (claudeKey) {
      console.warn('Falling back to Claude provider');
      return new ClaudeProvider(claudeKey);
    }

    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (openaiKey) {
      console.warn('Falling back to OpenAI provider');
      return new OpenAIProvider(openaiKey);
    }

    throw new Error(
      'No LLM API key configured. Please add one of the following to .env.local:\n' +
      '- VITE_OPENROUTER_API_KEY (recommended)\n' +
      '- VITE_OPENAI_API_KEY\n' +
      '- VITE_CLAUDE_API_KEY'
    );
  }

  /**
   * Process user request
   */
  async processUserRequest(userMessage: string): Promise<void> {
    try {
      // Save user message to database
      await createMessage({
        conversation_id: this.conversationId,
        role: 'user',
        content: userMessage,
      });

      // Update conversation timestamp
      await touchConversation(this.conversationId);

      // Create agent message for Mike
      const message = createAgentMessage(
        MessageType.USER_REQUEST,
        userMessage,
        AgentRole.USER,
        AgentRole.MIKE
      );

      this.messageHistory.push(message);

      // Get Mike agent
      const mike = this.agents.get(AgentRole.MIKE);
      if (!mike) {
        throw new Error('Mike agent not initialized');
      }

      // Set context for Mike
      mike.setContext({
        conversationId: this.conversationId,
        projectId: '', // TODO: Get from context
        userId: '', // TODO: Get from context
        mode: 'team',
        messages: this.messageHistory,
        tasks: Array.from(this.activeTasks.values()),
      });

      // Process with Mike - he will analyze and delegate
      const response = await mike.processMessage(message);

      if (response) {
        this.messageHistory.push(response);

        // Save Mike's response to database
        await createMessage({
          conversation_id: this.conversationId,
          role: 'assistant',
          agent_name: 'Mike',
          content: response.content,
        });

        // Notify UI
        this.config.onAgentMessage?.('Mike', response.content);

        // Check if Mike created tasks
        if (response.metadata?.tasks) {
          const tasks = response.metadata.tasks as Task[];
          await this.executeTasks(tasks);
        }
      }
    } catch (error) {
      console.error('Error processing user request:', error);
      this.config.onError?.(error as Error);
      
      // Save error message
      await createMessage({
        conversation_id: this.conversationId,
        role: 'system',
        content: `Error: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Execute tasks assigned by Mike
   */
  private async executeTasks(tasks: Task[]): Promise<void> {
    // Add tasks to active tasks
    tasks.forEach(task => {
      this.activeTasks.set(task.id, task);
      this.config.onTaskUpdate?.(task);
    });

    // Execute tasks in order, respecting dependencies
    for (const task of tasks) {
      await this.executeTask(task);
    }
  }

  /**
   * Execute a single task
   */
  private async executeTask(task: Task): Promise<void> {
    try {
      // Check dependencies
      if (task.dependencies && task.dependencies.length > 0) {
        const allDependenciesComplete = task.dependencies.every(depId => {
          const depTask = this.activeTasks.get(depId);
          return depTask && depTask.status === TaskStatus.COMPLETED;
        });

        if (!allDependenciesComplete) {
          console.log(`Task ${task.id} waiting for dependencies`);
          return;
        }
      }

      // Convert string assignee to AgentRole if needed
      const assigneeRole = this.parseAgentRole(task.assignee);
      
      // Get the agent for this task
      const agent = this.agents.get(assigneeRole);
      if (!agent) {
        throw new Error(`Agent ${task.assignee} not found`);
      }

      // Update task status
      task.status = TaskStatus.IN_PROGRESS;
      this.activeTasks.set(task.id, task);
      this.config.onTaskUpdate?.(task);

      // Set context
      agent.setContext({
        conversationId: this.conversationId,
        projectId: '', // TODO: Get from context
        userId: '', // TODO: Get from context
        mode: 'team',
        messages: this.messageHistory,
        tasks: Array.from(this.activeTasks.values()),
      });

      // Create task assignment message
      const assignmentMessage = createAgentMessage(
        MessageType.TASK_ASSIGNMENT,
        `Task: ${task.title}\n\n${task.description}`,
        AgentRole.MIKE,
        assigneeRole,
        { task }
      );

      this.messageHistory.push(assignmentMessage);

      // Process task with agent
      const response = await agent.processMessage(assignmentMessage);

      if (response) {
        this.messageHistory.push(response);

        // If task accepted, execute it
        if (response.type === MessageType.TASK_ACCEPTED) {
          const executedTask = await agent.executeTask(task);
          
          // Update task
          this.activeTasks.set(executedTask.id, executedTask);
          this.config.onTaskUpdate?.(executedTask);

          // Save agent's work to database
          if (executedTask.status === TaskStatus.COMPLETED) {
            // Get agent name safely
            const agentName = this.getAgentName(agent);
            const resultContent = `**${agentName} completed: ${executedTask.title}**\n\n${
              executedTask.result?.code || executedTask.result?.analysis || 'Task completed successfully.'
            }`;

            await createMessage({
              conversation_id: this.conversationId,
              role: 'assistant',
              agent_name: agentName,
              content: resultContent,
            });

            this.config.onAgentMessage?.(agentName, resultContent);
          }
        } else if (response.type === MessageType.TASK_REJECTED) {
          task.status = TaskStatus.FAILED;
          task.error = response.content;
          this.activeTasks.set(task.id, task);
          this.config.onTaskUpdate?.(task);
        }
      }
    } catch (error) {
      console.error(`Error executing task ${task.id}:`, error);
      task.status = TaskStatus.FAILED;
      task.error = (error as Error).message;
      this.activeTasks.set(task.id, task);
      this.config.onTaskUpdate?.(task);
      this.config.onError?.(error as Error);
    }
  }

  /**
   * Parse agent role from string
   */
  private parseAgentRole(assignee: string | AgentRole): AgentRole {
    if (typeof assignee === 'string') {
      // Try to match string to AgentRole enum
      const roleKey = Object.keys(AgentRole).find(
        key => AgentRole[key as keyof typeof AgentRole] === assignee
      );
      if (roleKey) {
        return AgentRole[roleKey as keyof typeof AgentRole];
      }
      // Default to ALEX if not found
      return AgentRole.ALEX;
    }
    return assignee;
  }

  /**
   * Get agent name safely
   */
  private getAgentName(agent: BaseAgent): string {
    return agent.getName();
  }

  /**
   * Get active tasks
   */
  getActiveTasks(): Task[] {
    return Array.from(this.activeTasks.values());
  }

  /**
   * Get message history
   */
  getMessageHistory(): AgentMessage[] {
    return this.messageHistory;
  }

  /**
   * Clear orchestrator state
   */
  clear(): void {
    this.messageHistory = [];
    this.activeTasks.clear();
  }
}
