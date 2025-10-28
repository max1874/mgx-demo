/**
 * ChatArea Component
 * 
 * Main chat interface with AI agent integration, Markdown rendering,
 * and real-time streaming responses.
 * 
 * @author Alex (Full-stack Engineer)
 * @date 2025-01-28
 */

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLayout } from '@/contexts/LayoutContext';
import { useAgent } from '@/contexts/AgentContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { MessageBubble } from './MessageBubble';
import { AgentStatusIndicator } from './AgentStatusIndicator';
import { Send, Loader2, Bot } from 'lucide-react';
import type { Database } from '@/types/database';
import type { AgentName } from '@/lib/agents/types';

type Message = Database['public']['Tables']['messages']['Row'];

export function ChatArea() {
  const { user } = useAuth();
  const { currentConversationId, currentMode } = useLayout();
  const { sendMessageStream, currentAgent, getAgentState } = useAgent();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<{
    agentName: AgentName;
    content: string;
  } | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch messages for current conversation
  useEffect(() => {
    if (!currentConversationId) {
      setMessages([]);
      return;
    }

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', currentConversationId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages(data || []);
      }
    };

    fetchMessages();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${currentConversationId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentConversationId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingMessage]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSend = async () => {
    if (!input.trim() || !currentConversationId || !user || loading) return;

    setLoading(true);
    const messageContent = input.trim();
    setInput('');

    try {
      // Save user message
      const { error: insertError } = await supabase
        .from('messages')
        .insert({
          conversation_id: currentConversationId,
          role: 'user',
          content: messageContent,
        });

      if (insertError) {
        console.error('Error sending message:', insertError);
        setInput(messageContent);
        return;
      }

      // Send to agent with streaming
      await sendMessageStream(
        messageContent,
        currentConversationId,
        currentMode || 'team',
        (content, agentName) => {
          setStreamingMessage(prev => ({
            agentName,
            content: (prev?.content || '') + content,
          }));
        }
      );

      // Clear streaming message after completion
      setStreamingMessage(null);
    } catch (error) {
      console.error('Error processing message:', error);
      setInput(messageContent);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!currentConversationId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="mx-auto h-24 w-24 rounded-full bg-muted flex items-center justify-center">
            <Bot className="h-12 w-12 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">No conversation selected</h3>
            <p className="text-sm text-muted-foreground">
              Select a conversation from the sidebar or create a new one to start chatting with AI agents
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground">
            <span className="px-2 py-1 bg-muted rounded">Team Mode</span>
            <span className="px-2 py-1 bg-muted rounded">Engineer Mode</span>
            <span className="px-2 py-1 bg-muted rounded">Research Mode</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="border-b px-6 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Chat</h2>
            <p className="text-xs text-muted-foreground">
              Mode: <span className="font-medium capitalize">{currentMode || 'team'}</span>
            </p>
          </div>
          {currentAgent && (
            <AgentStatusIndicator
              agentName={currentAgent}
              state={getAgentState(currentAgent)}
            />
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 px-6" ref={scrollRef}>
        <div className="py-6 space-y-1">
          {messages.length === 0 && !streamingMessage ? (
            <div className="text-center py-12">
              <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Bot className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Ask questions, request features, or get help with your project. Our AI agents are ready to assist you.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <div className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium border border-blue-200">
                  Mike - Team Leader
                </div>
                <div className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-full text-xs font-medium border border-purple-200">
                  Emma - Product Manager
                </div>
                <div className="px-3 py-1.5 bg-green-50 text-green-600 rounded-full text-xs font-medium border border-green-200">
                  Bob - System Architect
                </div>
                <div className="px-3 py-1.5 bg-orange-50 text-orange-600 rounded-full text-xs font-medium border border-orange-200">
                  Alex - Full-stack Engineer
                </div>
                <div className="px-3 py-1.5 bg-cyan-50 text-cyan-600 rounded-full text-xs font-medium border border-cyan-200">
                  David - Data Analyst
                </div>
                <div className="px-3 py-1.5 bg-pink-50 text-pink-600 rounded-full text-xs font-medium border border-pink-200">
                  Iris - Deep Researcher
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  role={message.role as 'user' | 'assistant'}
                  content={message.content}
                  agentName={message.agent_name as AgentName | undefined}
                  timestamp={message.created_at}
                />
              ))}
              
              {streamingMessage && (
                <MessageBubble
                  role="assistant"
                  content={streamingMessage.content}
                  agentName={streamingMessage.agentName}
                />
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t px-6 py-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message... (Shift+Enter for new line)"
              className="min-h-[60px] max-h-[200px] resize-none pr-12"
              disabled={loading}
              rows={1}
            />
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {input.length > 0 && `${input.length} chars`}
            </div>
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            size="icon"
            className="h-[60px] w-[60px] flex-shrink-0"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Enter</kbd> to send, 
          <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs ml-1">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}