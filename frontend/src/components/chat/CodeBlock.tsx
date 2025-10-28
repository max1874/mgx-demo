/**
 * CodeBlock Component
 * 
 * Displays code blocks with syntax highlighting and copy functionality.
 * 
 * @author Alex (Full-stack Engineer)
 * @date 2025-01-28
 */

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CodeBlockProps {
  language?: string;
  code: string;
  inline?: boolean;
}

export function CodeBlock({ language, code, inline }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  if (inline) {
    return (
      <code className="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">
        {code}
      </code>
    );
  }

  return (
    <div className="relative group my-4">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border rounded-t-lg">
        <span className="text-xs font-medium text-muted-foreground uppercase">
          {language || 'code'}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              <span className="text-xs">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </Button>
      </div>
      <pre className="overflow-x-auto p-4 bg-muted rounded-b-lg">
        <code className="text-sm font-mono">{code}</code>
      </pre>
    </div>
  );
}