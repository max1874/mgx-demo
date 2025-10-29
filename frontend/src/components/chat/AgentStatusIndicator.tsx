import { Bot, Loader2, CheckCircle2, XCircle } from 'lucide-react';

type AgentName = 'Mike' | 'Emma' | 'Bob' | 'Alex' | 'David';
type AgentState = 'idle' | 'thinking' | 'executing' | 'completed' | 'failed';

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
};

const STATE_CONFIG: Record<AgentState, { icon: typeof Bot; label: string; animate: boolean }> = {
  idle: { icon: Bot, label: 'Idle', animate: false },
  thinking: { icon: Loader2, label: 'Thinking', animate: true },
  executing: { icon: Loader2, label: 'Executing', animate: true },
  completed: { icon: CheckCircle2, label: 'Completed', animate: false },
  failed: { icon: XCircle, label: 'Failed', animate: false },
};

export function AgentStatusIndicator({ agentName, state }: AgentStatusIndicatorProps) {
  const config = STATE_CONFIG[state];
  const Icon = config.icon;
  const color = AGENT_COLORS[agentName];

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border">
      <div className={`h-2 w-2 rounded-full ${color} ${config.animate ? 'animate-pulse' : ''}`} />
      <Icon className={`h-4 w-4 ${config.animate ? 'animate-spin' : ''}`} />
      <span className="text-sm font-medium">{agentName}</span>
      <span className="text-xs text-muted-foreground">{config.label}</span>
    </div>
  );
}
