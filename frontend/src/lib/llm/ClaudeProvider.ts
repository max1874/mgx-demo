/**
 * Claude Provider Implementation
 * 
 * This class implements the LLMProvider interface for Anthropic's Claude models.
 */

import { LLMProvider, LLMMessage, LLMResponse, StreamChunk, LLMConfig } from './LLMProvider';

export class ClaudeProvider extends LLMProvider {
  private baseUrl = 'https://api.anthropic.com/v1';

  constructor(config: LLMConfig) {
    super(config);
  }

  private convertMessages(messages: LLMMessage[]): { system?: string; messages: any[] } {
    const systemMessage = messages.find(m => m.role === 'system');
    const conversationMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

    return {
      system: systemMessage?.content,
      messages: conversationMessages,
    };
  }

  async complete(messages: LLMMessage[]): Promise<LLMResponse> {
    try {
      const { system, messages: convertedMessages } = this.convertMessages(messages);

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: convertedMessages,
          system,
          max_tokens: this.config.maxTokens ?? 2000,
          temperature: this.config.temperature ?? 0.7,
          top_p: this.config.topP ?? 1,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Claude API error: ${error.error?.message || response.statusText}`);
      }

      const data = await response.json();
      
      return {
        content: data.content[0].text,
        usage: {
          promptTokens: data.usage.input_tokens,
          completionTokens: data.usage.output_tokens,
          totalTokens: data.usage.input_tokens + data.usage.output_tokens,
        },
        model: data.model,
      };
    } catch (error) {
      console.error('Claude completion error:', error);
      throw error;
    }
  }

  async streamComplete(
    messages: LLMMessage[],
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void> {
    try {
      const { system, messages: convertedMessages } = this.convertMessages(messages);

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: convertedMessages,
          system,
          max_tokens: this.config.maxTokens ?? 2000,
          temperature: this.config.temperature ?? 0.7,
          top_p: this.config.topP ?? 1,
          stream: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Claude API error: ${error.error?.message || response.statusText}`);
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
          if (line.trim() === '' || !line.startsWith('data: ')) {
            continue;
          }

          try {
            const data = JSON.parse(line.slice(6));
            
            if (data.type === 'content_block_delta' && data.delta?.text) {
              onChunk({ content: data.delta.text, done: false });
            } else if (data.type === 'message_stop') {
              onChunk({ content: '', done: true });
            }
          } catch (error) {
            console.error('Error parsing stream chunk:', error);
          }
        }
      }
    } catch (error) {
      console.error('Claude stream error:', error);
      throw error;
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      // Claude doesn't have a simple validation endpoint, so we'll try a minimal request
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('API key validation error:', error);
      return false;
    }
  }

  getProviderName(): string {
    return 'Claude';
  }
}