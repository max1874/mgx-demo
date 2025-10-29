/**
 * Base Agent Class
 * 
 * Provides common functionality for all agents including:
 * - LLM interaction
 * - Message processing
 * - Context management
 * - Streaming support
 */

import type { LLMProvider } from '../llm/LLMProvider';
import type { AgentMessage, Task, AgentContext, AgentRole } from './MessageProtocol';

export interface AgentConfig {
  role: AgentRole;
  name: string;
  description: string;
  systemPrompt: string;
  llmProvider: LLMProvider;
}

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected context?: AgentContext;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  /**
   * Set agent context
   */
  setContext(context: AgentContext): void {
    this.context = context;
  }

  /**
   * Get agent context
   */
  getContext(): AgentContext | undefined {
    return this.context;
  }

  /**
   * Get agent name
   */
  getName(): string {
    return this.config.name;
  }

  /**
   * Get agent role
   */
  getRole(): AgentRole {
    return this.config.role;
  }

  /**
   * Generate response using LLM (non-streaming)
   */
  protected async generateResponse(prompt: string): Promise<string> {
    const messages = [
      { role: 'system' as const, content: this.config.systemPrompt },
      { role: 'user' as const, content: prompt },
    ];

    const response = await this.config.llmProvider.complete(messages);
    return response.content;
  }

  /**
   * Generate streaming response using LLM
   */
  protected async generateStreamingResponse(
    prompt: string,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    const messages = [
      { role: 'system' as const, content: this.config.systemPrompt },
      { role: 'user' as const, content: prompt },
    ];

    let fullResponse = '';

    await this.config.llmProvider.streamComplete(messages, (chunk) => {
      if (!chunk.done && chunk.content) {
        fullResponse += chunk.content;
        onChunk(chunk.content);
      }
    });

    return fullResponse;
  }

  /**
   * Process message (non-streaming) - to be implemented by subclasses
   */
  abstract processMessage(message: AgentMessage): Promise<AgentMessage | null>;

  /**
   * Process message with streaming support
   */
  async processMessageStreaming(
    message: AgentMessage,
    onChunk: (chunk: string) => void
  ): Promise<AgentMessage | null> {
    // Default implementation - subclasses can override for custom streaming behavior
    // For now, just call the non-streaming version
    return this.processMessage(message);
  }

  /**
   * Execute task - to be implemented by subclasses
   */
  abstract executeTask(task: Task): Promise<Task>;

  /**
   * Check if agent can handle a specific task
   */
  abstract canHandleTask(task: Task): boolean;
}