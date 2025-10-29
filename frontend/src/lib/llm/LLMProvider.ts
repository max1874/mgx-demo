/**
 * LLM Provider Abstract Class
 * 
 * This abstract class defines the interface for all LLM providers.
 * It provides a unified API for different LLM services (OpenAI, Claude, Gemini, etc.)
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model?: string;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

export interface LLMConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
}

export abstract class LLMProvider {
  protected config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  /**
   * Generate a completion from the LLM
   * @param messages - Array of messages in the conversation
   * @returns Promise resolving to LLM response
   */
  abstract complete(messages: LLMMessage[]): Promise<LLMResponse>;

  /**
   * Generate a streaming completion from the LLM
   * @param messages - Array of messages in the conversation
   * @param onChunk - Callback function called for each chunk
   * @returns Promise resolving when stream is complete
   */
  abstract streamComplete(
    messages: LLMMessage[],
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void>;

  /**
   * Validate the API key
   * @returns Promise resolving to true if valid, false otherwise
   */
  abstract validateApiKey(): Promise<boolean>;

  /**
   * Get the provider name
   */
  abstract getProviderName(): string;

  /**
   * Get the current model
   */
  getModel(): string {
    return this.config.model;
  }

  /**
   * Update the configuration
   */
  updateConfig(config: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...config };
  }
}