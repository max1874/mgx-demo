/**
 * MessageBubble Component
 * 
 * Displays a chat message with Markdown rendering and syntax highlighting.
 * 
 * @author Alex (Full-stack Engineer)
 * @date 2025-01-28
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { Bot, User } from 'lucide-react';
import { CodeBlock } from './CodeBlock';
import type { AgentName } from '@/lib/agents/types';
import 'highlight.js/styles/github-dark.css';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  agentName?: AgentName;
  timestamp?: string;
}

const AGENT_COLORS: Record<AgentName, { bg: string; text: string; border: string }> = {
  Mike: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
  Emma: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
  Bob: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  Alex: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
  David: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200' },
  Iris: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200' },
};

const AGENT_AVATAR_COLORS: Record<AgentName, string> = {
  Mike: 'bg-blue-500',
  Emma: 'bg-purple-500',
  Bob: 'bg-green-500',
  Alex: 'bg-orange-500',
  David: 'bg-cyan-500',
  Iris: 'bg-pink-500',
};

export function MessageBubble({ role, content, agentName, timestamp }: MessageBubbleProps) {
  const isUser = role === 'user';
  const colors = agentName ? AGENT_COLORS[agentName] : null;
  const avatarColor = agentName ? AGENT_AVATAR_COLORS[agentName] : 'bg-muted';

  const formatTimestamp = (ts?: string) => {
    if (!ts) return '';
    const date = new Date(ts);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`flex gap-3 max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 h-8 w-8 rounded-full ${avatarColor} flex items-center justify-center`}>
          {isUser ? (
            <User className="h-4 w-4 text-white" />
          ) : (
            <Bot className="h-4 w-4 text-white" />
          )}
        </div>

        {/* Message Content */}
        <div className="flex flex-col gap-1">
          {/* Header */}
          <div className={`flex items-center gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-xs font-medium">
              {isUser ? 'You' : agentName || 'AI'}
            </span>
            {timestamp && (
              <span className="text-xs text-muted-foreground">
                {formatTimestamp(timestamp)}
              </span>
            )}
          </div>

          {/* Message Bubble */}
          <div
            className={`rounded-lg px-4 py-3 ${
              isUser
                ? 'bg-primary text-primary-foreground'
                : colors
                ? `${colors.bg} border ${colors.border}`
                : 'bg-muted'
            }`}
          >
            {isUser ? (
              <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
            ) : (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight, rehypeRaw]}
                  components={{
                    code({ node, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeContent = String(children).replace(/\n$/, '');
                      const isInline = !match && !className;
                      
                      return isInline ? (
                        <CodeBlock code={codeContent} inline={true} />
                      ) : (
                        <CodeBlock
                          language={match?.[1]}
                          code={codeContent}
                          inline={false}
                        />
                      );
                    },
                    p({ children }) {
                      return <p className="mb-2 last:mb-0">{children}</p>;
                    },
                    ul({ children }) {
                      return <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>;
                    },
                    ol({ children }) {
                      return <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>;
                    },
                    li({ children }) {
                      return <li className="text-sm">{children}</li>;
                    },
                    h1({ children }) {
                      return <h1 className="text-xl font-bold mb-2 mt-4">{children}</h1>;
                    },
                    h2({ children }) {
                      return <h2 className="text-lg font-bold mb-2 mt-3">{children}</h2>;
                    },
                    h3({ children }) {
                      return <h3 className="text-base font-bold mb-2 mt-2">{children}</h3>;
                    },
                    blockquote({ children }) {
                      return (
                        <blockquote className="border-l-4 border-border pl-4 italic my-2">
                          {children}
                        </blockquote>
                      );
                    },
                    a({ href, children }) {
                      return (
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={colors ? colors.text : 'text-primary hover:underline'}
                        >
                          {children}
                        </a>
                      );
                    },
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}