/**
 * LLM Provider Factory
 * 
 * Creates appropriate LLM provider based on model type
 */

import { LLMProvider } from './LLMProvider';
import { OpenRouterProvider } from './OpenRouterProvider';
import { ModelType, getModelConfig } from './ModelConfig';

export class LLMProviderFactory {
  /**
   * Create LLM provider based on model type
   */
  static createProvider(modelType: ModelType): LLMProvider {
    const config = getModelConfig(modelType);
    
    console.log('🔧 LLMProviderFactory: Creating provider for model:', {
      modelType,
      displayName: config.displayName,
      defaultModel: config.defaultModel,
      provider: config.provider
    });
    
    // Get API key from environment
    const apiKey = import.meta.env[config.apiKeyEnvVar];
    
    if (!apiKey) {
      throw new Error(
        `Missing API key for ${config.displayName}. ` +
        `Please set ${config.apiKeyEnvVar} in your environment variables.`
      );
    }

    // For now, all models use OpenRouter
    // In the future, we can add specific providers for each model
    switch (config.provider) {
      case 'anthropic':
      case 'openai':
      case 'google':
        const provider = new OpenRouterProvider(apiKey, config.defaultModel);
        console.log('✅ LLMProviderFactory: Provider created successfully with model:', provider.getModel());
        return provider;
      
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  /**
   * Validate that required API keys are available
   */
  static validateApiKeys(): { valid: boolean; missing: string[] } {
    const missing: string[] = [];
    
    Object.values(ModelType).forEach(modelType => {
      const config = getModelConfig(modelType);
      const apiKey = import.meta.env[config.apiKeyEnvVar];
      
      if (!apiKey) {
        missing.push(config.apiKeyEnvVar);
      }
    });

    return {
      valid: missing.length === 0,
      missing: [...new Set(missing)], // Remove duplicates
    };
  }

  /**
   * Get available models based on configured API keys
   */
  static getAvailableModels(): ModelType[] {
    const available: ModelType[] = [];
    
    Object.values(ModelType).forEach(modelType => {
      const config = getModelConfig(modelType);
      const apiKey = import.meta.env[config.apiKeyEnvVar];
      
      if (apiKey) {
        available.push(modelType);
      }
    });

    return available;
  }
}