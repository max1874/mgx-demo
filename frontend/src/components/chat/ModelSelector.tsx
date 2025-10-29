/**
 * Model Selector Component
 * 
 * Allows users to select which LLM model to use for all agents
 */

import { Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useModel } from '@/contexts/ModelContext';
import { getAvailableModels } from '@/lib/llm/ModelConfig';
import { cn } from '@/lib/utils';

export function ModelSelector() {
  const { selectedModel, setSelectedModel, modelConfig, isChanging } = useModel();
  const availableModels = getAvailableModels();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-9 px-3 text-sm font-medium gap-2"
          disabled={isChanging}
        >
          <span className="text-lg">{modelConfig.icon}</span>
          <span>{modelConfig.displayName}</span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 bg-gray-900 border-gray-800 text-white"
      >
        {availableModels.map((config) => {
          const isSelected = selectedModel === config.id;

          return (
            <DropdownMenuItem
              key={config.id}
              onClick={() => setSelectedModel(config.id)}
              className={cn(
                'flex items-center gap-3 px-3 py-3 cursor-pointer',
                'hover:bg-gray-800 focus:bg-gray-800',
                isSelected && 'bg-gray-800'
              )}
            >
              <span className="text-2xl">{config.icon}</span>
              <div className="flex-1">
                <div className="font-medium">{config.description}</div>
                <div className="text-sm text-gray-400">{config.displayName}</div>
              </div>
              {isSelected && (
                <Check className="h-5 w-5 text-white" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}