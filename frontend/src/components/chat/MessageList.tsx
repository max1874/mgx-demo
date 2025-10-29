/**
 * Message List Component
 * 
 * Displays a list of messages in the conversation with auto-scroll functionality.
 */

import { useEffect, useRef } from 'react';
import { MessageBubble } from './MessageBubble';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Database } from '@/types/database';

type Message = Database['public']['Tables']['messages']['Row'];

interface MessageListProps {
  messages: Message[];
  streamingMessage?: {
    agentName: string;
    content: string;
  } | null;
}

export function MessageList({ messages, streamingMessage }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingMessage]);

  if (messages.length === 0 && !streamingMessage) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>No messages yet. Start a conversation!</p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
      <div className="space-y-4 max-w-4xl mx-auto">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            role={message.role as 'user' | 'assistant' | 'system'}
            content={message.content}
            agentName={message.agent_name || undefined}
            timestamp={message.created_at || undefined}
          />
        ))}
        
        {streamingMessage && (
          <MessageBubble
            role="assistant"
            content={streamingMessage.content}
            agentName={streamingMessage.agentName}
            streaming
          />
        )}
      </div>
    </ScrollArea>
  );
}