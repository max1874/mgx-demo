/**
 * OpenAI Provider Implementation
 * 
 * This class implements the LLMProvider interface for OpenAI's GPT models.
 * It supports both standard completion and streaming responses.
 */

import { LLMProvider, LLMMessage, LLMResponse, StreamChunk, LLMConfig } from './LLMProvider';

export class OpenAIProvider extends LLMProvider {
  private baseUrl = 'https://api.openai.com/v1';

  constructor(config: LLMConfig) {
    super(config);
  }

  async complete(messages: LLMMessage[]): Promise<LLMResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: this.config.temperature ?? 0.7,
          max_tokens: this.config.maxTokens ?? 2000,
          top_p: this.config.topP ?? 1,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      return {
        content: data.choices[0].message.content,
        usage: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens,
        },
        model: data.model,
      };
    } catch (error) {
      console.error('OpenAI completion error:', error);
      throw error;
    }
  }

  async streamComplete(
    messages: LLMMessage[],
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: this.config.temperature ?? 0.7,
          max_tokens: this.config.maxTokens ?? 2000,
          top_p: this.config.topP ?? 1,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to get response reader');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          onChunk({ content: '', done: true });
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '' || line.trim() === 'data: [DONE]') {
            continue;
          }

          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices[0]?.delta?.content || '';
              
              if (content) {
                onChunk({ content, done: false });
              }
            } catch (error) {
              console.error('Error parsing stream chunk:', error);
            }
          }
        }
      }
    } catch (error) {
      console.error('OpenAI stream error:', error);
      throw error;
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('API key validation error:', error);
      return false;
    }
  }

  getProviderName(): string {
    return 'OpenAI';
  }
}