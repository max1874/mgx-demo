/**
 * Message Bubble Component
 * 
 * Displays a single message with proper formatting, including:
 * - User/assistant/system message styling
 * - Agent avatar and name
 * - Markdown rendering
 * - Code syntax highlighting
 * - Timestamp
 */

import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';
import type { Components } from 'react-markdown';

interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  agentName?: string;
  timestamp?: string;
  streaming?: boolean;
}

function MessageBubbleComponent({
  role,
  content,
  agentName,
  timestamp,
  streaming = false,
}: MessageBubbleProps) {
  const isUser = role === 'user';
  const isSystem = role === 'system';

  // Format timestamp
  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  // System messages
  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-muted px-4 py-2 rounded-lg text-sm text-muted-foreground max-w-2xl">
          {content}
        </div>
      </div>
    );
  }

  // Markdown components
  const markdownComponents: Components = {
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const isInline = !match;
      
      if (isInline) {
        return (
          <code
            className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
            {...props}
          >
            {children}
          </code>
        );
      }

      const codeString = String(children).replace(/\n$/, '');
      
      return (
        <SyntaxHighlighter
          style={vscDarkPlus as any}
          language={match[1]}
          PreTag="div"
          className="rounded-md my-2"
        >
          {codeString}
        </SyntaxHighlighter>
      );
    },
    p({ children }) {
      return <p className="mb-2 last:mb-0">{children}</p>;
    },
    ul({ children }) {
      return <ul className="list-disc list-inside mb-2">{children}</ul>;
    },
    ol({ children }) {
      return <ol className="list-decimal list-inside mb-2">{children}</ol>;
    },
    a({ href, children }) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          {children}
        </a>
      );
    },
  };

  return (
    <div
      className={cn(
        'flex gap-3 mb-4',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      {/* Message content */}
      <div
        className={cn(
          'flex flex-col gap-1 max-w-[80%]',
          isUser ? 'items-end' : 'items-start'
        )}
      >
        {/* Agent name and timestamp */}
        {!isUser && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
            {agentName && <span className="font-medium">{agentName}</span>}
            {formattedTime && <span>{formattedTime}</span>}
          </div>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            'rounded-lg px-4 py-2',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted',
            streaming && 'animate-pulse'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown components={markdownComponents}>
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>

        {/* User timestamp */}
        {isUser && formattedTime && (
          <div className="text-xs text-muted-foreground px-1">
            {formattedTime}
          </div>
        )}
      </div>
    </div>
  );
}

export const MessageBubble = memo(MessageBubbleComponent);
