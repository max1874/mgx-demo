/**
 * Model Configuration
 * 
 * Defines available LLM models and their configurations
 */

export enum ModelType {
  CLAUDE_SONNET = 'claude-sonnet',
  GPT_5 = 'gpt-5',
  GEMINI_PRO = 'gemini-pro',
}

export interface ModelConfig {
  id: ModelType;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  category: 'premium' | 'standard' | 'focused';
  provider: 'anthropic' | 'openai' | 'google';
  apiKeyEnvVar: string;
  defaultModel: string;
}

export const MODEL_CONFIGS: Record<ModelType, ModelConfig> = {
  [ModelType.CLAUDE_SONNET]: {
    id: ModelType.CLAUDE_SONNET,
    name: 'claude-sonnet',
    displayName: 'Claude Sonnet 4.5',
    description: '高级创作',
    icon: '💎',
    category: 'premium',
    provider: 'anthropic',
    apiKeyEnvVar: 'VITE_OPENROUTER_API_KEY',
    defaultModel: 'anthropic/claude-3.5-sonnet',
  },
  [ModelType.GPT_5]: {
    id: ModelType.GPT_5,
    name: 'gpt-5',
    displayName: 'GPT 5',
    description: '标准',
    icon: '🔊',
    category: 'standard',
    provider: 'openai',
    apiKeyEnvVar: 'VITE_OPENROUTER_API_KEY',
    defaultModel: 'openai/gpt-4-turbo',
  },
  [ModelType.GEMINI_PRO]: {
    id: ModelType.GEMINI_PRO,
    name: 'gemini-pro',
    displayName: 'Gemini 2.5 Pro',
    description: '专注',
    icon: '☁️',
    category: 'focused',
    provider: 'google',
    apiKeyEnvVar: 'VITE_OPENROUTER_API_KEY',
    defaultModel: 'google/gemini-2.0-flash-exp:free',
  },
};

export const DEFAULT_MODEL = ModelType.CLAUDE_SONNET;

export const MODEL_STORAGE_KEY = 'mgx-selected-model';

/**
 * Get model config by type
 */
export function getModelConfig(modelType: ModelType): ModelConfig {
  return MODEL_CONFIGS[modelType];
}

/**
 * Get all available models
 */
export function getAvailableModels(): ModelConfig[] {
  return Object.values(MODEL_CONFIGS);
}

/**
 * Save selected model to localStorage
 */
export function saveSelectedModel(modelType: ModelType): void {
  localStorage.setItem(MODEL_STORAGE_KEY, modelType);
}

/**
 * Load selected model from localStorage
 */
export function loadSelectedModel(): ModelType {
  const saved = localStorage.getItem(MODEL_STORAGE_KEY);
  if (saved && Object.values(ModelType).includes(saved as ModelType)) {
    return saved as ModelType;
  }
  return DEFAULT_MODEL;
}