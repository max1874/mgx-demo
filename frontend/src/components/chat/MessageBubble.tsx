import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { CodeBlock } from './CodeBlock';
import { Bot, User } from 'lucide-react';
import { format } from 'date-fns';
import 'highlight.js/styles/github-dark.css';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  agentName?: string;
  timestamp?: string;
}

type AgentName = 'Mike' | 'Emma' | 'Bob' | 'Alex' | 'David' | 'Iris';

const AGENT_COLORS: Record<AgentName, { bg: string; text: string; border: string }> = {
  Mike: { bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-200' },
  Emma: { bg: 'bg-purple-500', text: 'text-purple-600', border: 'border-purple-200' },
  Bob: { bg: 'bg-green-500', text: 'text-green-600', border: 'border-green-200' },
  Alex: { bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-200' },
  David: { bg: 'bg-cyan-500', text: 'text-cyan-600', border: 'border-cyan-200' },
  Iris: { bg: 'bg-pink-500', text: 'text-pink-600', border: 'border-pink-200' },
};

export function MessageBubble({ role, content, agentName, timestamp }: MessageBubbleProps) {
  const isUser = role === 'user';
  const colors = agentName ? AGENT_COLORS[agentName as AgentName] : null;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div
        className={`max-w-[80%] rounded-lg p-4 ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : colors
            ? `bg-background border-2 ${colors.border}`
            : 'bg-muted'
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          {isUser ? (
            <User className="h-4 w-4" />
          ) : (
            <Bot className="h-4 w-4" />
          )}
          <span className="text-xs font-medium">
            {isUser ? 'You' : agentName || 'AI'}
          </span>
          {agentName && colors && (
            <div className={`h-2 w-2 rounded-full ${colors.bg}`} />
          )}
          {timestamp && (
            <span className="text-xs opacity-60 ml-auto">
              {format(new Date(timestamp), 'HH:mm')}
            </span>
          )}
        </div>

        {/* Content */}
        <div className={`prose prose-sm max-w-none ${isUser ? 'prose-invert' : 'dark:prose-invert'}`}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight, rehypeRaw]}
            components={{
              code({ className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : '';
                const isInline = !className;

                if (isInline) {
                  return (
                    <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono" {...props}>
                      {children}
                    </code>
                  );
                }

                return (
                  <CodeBlock
                    language={language}
                    code={String(children).replace(/\n$/, '')}
                  />
                );
              },
              pre({ children }) {
                return <>{children}</>;
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}