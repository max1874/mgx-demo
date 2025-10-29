/**
 * OpenRouter LLM Provider
 * 
 * Provides access to multiple LLM models through OpenRouter API.
 * Supports streaming and non-streaming responses.
 */

import { LLMProvider, LLMMessage, LLMResponse, StreamChunk } from './LLMProvider';

export class OpenRouterProvider extends LLMProvider {
  private baseURL = 'https://openrouter.ai/api/v1';

  constructor(apiKey: string, model?: string) {
    super({
      apiKey,
      model: model || 'anthropic/claude-4.5-sonnet',
      temperature: 0.7,
      maxTokens: 4096,
    });
    
    console.log('🔧 OpenRouterProvider: Initialized with model:', this.config.model);
  }

  /**
   * Validate API key
   */
  async validateApiKey(): Promise<boolean> {
    return !!this.config.apiKey && this.config.apiKey.startsWith('sk-or-');
  }

  /**
   * Get provider name
   */
  getProviderName(): string {
    return 'OpenRouter';
  }

  /**
   * Complete a chat conversation (non-streaming)
   */
  async complete(messages: LLMMessage[]): Promise<LLMResponse> {
    try {
      console.log('📤 OpenRouterProvider: Sending request with model:', this.config.model);
      
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'MGX Demo',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          stream: false,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `OpenRouter API error: ${response.status}`);
      }

      const data = await response.json();
      
      console.log('📥 OpenRouterProvider: Received response from model:', data.model);
      
      return {
        content: data.choices[0].message.content,
        model: data.model,
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0,
        },
      };
    } catch (error) {
      console.error('❌ OpenRouter API error:', error);
      throw error;
    }
  }

  /**
   * Complete a chat conversation with streaming
   */
  async streamComplete(
    messages: LLMMessage[],
    onChunk: (chunk: StreamChunk) => void
  ): Promise<void> {
    try {
      console.log('📤 OpenRouterProvider: Sending streaming request with model:', this.config.model);
      
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'MGX Demo',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: messages.map(msg => ({
            role: msg.role,
            content: msg.content,
          })),
          stream: true,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `OpenRouter API error: ${response.status}`);
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
          if (line.trim() === '') continue;
          if (line.trim() === 'data: [DONE]') {
            onChunk({ content: '', done: true });
            return;
          }

          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices[0]?.delta?.content;
              
              if (content) {
                onChunk({ content, done: false });
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ OpenRouter streaming error:', error);
      throw error;
    }
  }
}