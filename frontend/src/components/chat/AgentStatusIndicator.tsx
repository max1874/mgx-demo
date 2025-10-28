/**
 * AgentStatusIndicator Component
 * 
 * Displays the current active agent and their execution state.
 * 
 * @author Alex (Full-stack Engineer)
 * @date 2025-01-28
 */

import { Bot, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import type { AgentName, AgentState } from '@/lib/agents/types';

interface AgentStatusIndicatorProps {
  agentName: AgentName;
  state: AgentState;
}

const AGENT_COLORS: Record<AgentName, string> = {
  Mike: 'bg-blue-500',
  Emma: 'bg-purple-500',
  Bob: 'bg-green-500',
  Alex: 'bg-orange-500',
  David: 'bg-cyan-500',
  Iris: 'bg-pink-500',
};

const STATE_CONFIG: Record<AgentState, { icon: React.ReactNode; label: string; animate?: boolean }> = {
  idle: { icon: <Bot className="h-4 w-4" />, label: 'Idle' },
  thinking: { icon: <Loader2 className="h-4 w-4 animate-spin" />, label: 'Thinking', animate: true },
  executing: { icon: <Loader2 className="h-4 w-4 animate-spin" />, label: 'Executing', animate: true },
  completed: { icon: <CheckCircle2 className="h-4 w-4" />, label: 'Completed' },
  failed: { icon: <XCircle className="h-4 w-4" />, label: 'Failed' },
};

export function AgentStatusIndicator({ agentName, state }: AgentStatusIndicatorProps) {
  const config = STATE_CONFIG[state];
  const colorClass = AGENT_COLORS[agentName];

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg border border-border">
      <div className={`h-2 w-2 rounded-full ${colorClass} ${config.animate ? 'animate-pulse' : ''}`} />
      {config.icon}
      <div className="flex flex-col">
        <span className="text-xs font-medium">{agentName}</span>
        <span className="text-xs text-muted-foreground">{config.label}</span>
      </div>
    </div>
  );
}