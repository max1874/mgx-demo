/**
 * Model Context
 * 
 * Manages the selected LLM model across the application
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ModelType, loadSelectedModel, saveSelectedModel, getModelConfig } from '@/lib/llm/ModelConfig';

interface ModelContextType {
  selectedModel: ModelType;
  setSelectedModel: (model: ModelType) => void;
  modelConfig: ReturnType<typeof getModelConfig>;
  isChanging: boolean;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [selectedModel, setSelectedModelState] = useState<ModelType>(() => loadSelectedModel());
  const [isChanging, setIsChanging] = useState(false);

  const modelConfig = getModelConfig(selectedModel);

  const setSelectedModel = useCallback((model: ModelType) => {
    setIsChanging(true);
    setSelectedModelState(model);
    saveSelectedModel(model);
    
    // Reset changing state after a short delay
    setTimeout(() => setIsChanging(false), 500);
  }, []);

  return (
    <ModelContext.Provider
      value={{
        selectedModel,
        setSelectedModel,
        modelConfig,
        isChanging,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error('useModel must be used within ModelProvider');
  }
  return context;
}