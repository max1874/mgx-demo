/**
 * Base Agent Class
 * 
 * This abstract class defines the interface and common functionality for all agents.
 * Each agent represents a team member with specific skills and responsibilities.
 */

import { LLMProvider, LLMMessage } from '../llm/LLMProvider';
import {
  AgentMessage,
  AgentRole,
  AgentContext,
  Task,
  MessageType,
  TaskStatus,
  createAgentMessage,
  updateTaskStatus,
} from './MessageProtocol';

export interface AgentConfig {
  role: AgentRole;
  name: string;
  description: string;
  systemPrompt: string;
  llmProvider: LLMProvider;
}

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected llmProvider: LLMProvider;
  protected context?: AgentContext;

  constructor(config: AgentConfig) {
    this.config = config;
    this.llmProvider = config.llmProvider;
  }

  /**
   * Get the agent's role
   */
  getRole(): AgentRole {
    return this.config.role;
  }

  /**
   * Get the agent's name
   */
  getName(): string {
    return this.config.name;
  }

  /**
   * Get the agent's description
   */
  getDescription(): string {
    return this.config.description;
  }

  /**
   * Set the agent's context
   */
  setContext(context: AgentContext): void {
    this.context = context;
  }

  /**
   * Process a message from another agent or user
   */
  abstract processMessage(message: AgentMessage): Promise<AgentMessage | null>;

  /**
   * Execute a task assigned to this agent
   */
  abstract executeTask(task: Task): Promise<Task>;

  /**
   * Check if this agent can handle a specific task
   */
  abstract canHandleTask(task: Task): boolean;

  /**
   * Generate a response using the LLM
   */
  protected async generateResponse(
    userMessage: string,
    conversationHistory?: AgentMessage[]
  ): Promise<string> {
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: this.config.systemPrompt,
      },
    ];

    // Add conversation history
    if (conversationHistory) {
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.from === this.config.role ? 'assistant' : 'user',
          content: `[${msg.from}]: ${msg.content}`,
        });
      }
    }

    // Add current message
    messages.push({
      role: 'user',
      content: userMessage,
    });

    try {
      const response = await this.llmProvider.complete(messages);
      return response.content;
    } catch (error) {
      console.error(`Error generating response for ${this.config.role}:`, error);
      throw error;
    }
  }

  /**
   * Generate a streaming response using the LLM
   */
  protected async generateStreamingResponse(
    userMessage: string,
    onChunk: (content: string) => void,
    conversationHistory?: AgentMessage[]
  ): Promise<void> {
    const messages: LLMMessage[] = [
      {
        role: 'system',
        content: this.config.systemPrompt,
      },
    ];

    // Add conversation history
    if (conversationHistory) {
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.from === this.config.role ? 'assistant' : 'user',
          content: `[${msg.from}]: ${msg.content}`,
        });
      }
    }

    // Add current message
    messages.push({
      role: 'user',
      content: userMessage,
    });

    try {
      await this.llmProvider.streamComplete(messages, (chunk) => {
        if (!chunk.done && chunk.content) {
          onChunk(chunk.content);
        }
      });
    } catch (error) {
      console.error(`Error generating streaming response for ${this.config.role}:`, error);
      throw error;
    }
  }

  /**
   * Send a message to another agent or broadcast
   */
  protected sendMessage(
    type: MessageType,
    content: string,
    to?: AgentRole | AgentRole[],
    metadata?: Record<string, any>
  ): AgentMessage {
    return createAgentMessage(type, this.config.role, content, { to, metadata });
  }

  /**
   * Update task status
   */
  protected updateTask(task: Task, status: TaskStatus, result?: any, error?: string): Task {
    return updateTaskStatus(task, status, result, error);
  }

  /**
   * Log agent activity
   */
  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${this.config.role}]`;
    
    switch (level) {
      case 'info':
        console.log(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
    }
  }
}