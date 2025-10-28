import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLayout } from '@/contexts/LayoutContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { MessageBubble } from './MessageBubble';
import { AgentStatusIndicator } from './AgentStatusIndicator';
import { Send, Loader2, Bot } from 'lucide-react';
import type { Database } from '@/types/database';

type Message = Database['public']['Tables']['messages']['Row'];
type AgentName = 'Mike' | 'Emma' | 'Bob' | 'Alex' | 'David' | 'Iris';
type AgentState = 'idle' | 'thinking' | 'executing' | 'completed' | 'failed';

export function ChatArea() {
  const { user } = useAuth();
  const { currentConversationId } = useLayout();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentAgent, setCurrentAgent] = useState<AgentName | null>(null);
  const [agentState, setAgentState] = useState<AgentState>('idle');
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
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
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

      // Simulate agent response (replace with actual agent integration)
      setCurrentAgent('Alex');
      setAgentState('thinking');
      
      // Simulate streaming response
      setTimeout(() => {
        setAgentState('executing');
        const response = `I've received your message: "${messageContent}"\n\nThis is a placeholder response. The actual agent integration will provide real AI-powered responses.`;
        
        let index = 0;
        const streamInterval = setInterval(() => {
          if (index < response.length) {
            setStreamingMessage({
              agentName: 'Alex',
              content: response.slice(0, index + 1),
            });
            index++;
          } else {
            clearInterval(streamInterval);
            setAgentState('completed');
            
            // Save agent response
            supabase.from('messages').insert({
              conversation_id: currentConversationId,
              role: 'assistant',
              agent_name: 'Alex',
              content: response,
            });
            
            setTimeout(() => {
              setStreamingMessage(null);
              setCurrentAgent(null);
              setAgentState('idle');
            }, 1000);
          }
        }, 20);
      }, 1000);
    } catch (error) {
      console.error('Error processing message:', error);
      setInput(messageContent);
      setAgentState('failed');
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
        <div className="text-center space-y-4 max-w-2xl px-4">
          <Bot className="h-16 w-16 mx-auto text-muted-foreground" />
          <h3 className="text-2xl font-semibold">Welcome to MGX Demo</h3>
          <p className="text-muted-foreground">
            Select a conversation from the sidebar or create a new one to start chatting with our AI agents.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
            {['Mike', 'Emma', 'Bob', 'Alex', 'David', 'Iris'].map((agent) => (
              <div key={agent} className="p-4 rounded-lg border border-border bg-card hover:bg-accent transition-colors">
                <Bot className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium text-center">{agent}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Chat</h2>
          {currentAgent && (
            <AgentStatusIndicator agentName={currentAgent} state={agentState} />
          )}
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.length === 0 && !streamingMessage ? (
            <div className="text-center text-muted-foreground py-12">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">No messages yet</p>
              <p className="text-sm">Start the conversation by typing a message below</p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  role={message.role as 'user' | 'assistant'}
                  content={message.content}
                  agentName={message.agent_name || undefined}
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

      {/* Input */}
      <div className="border-t p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="min-h-[60px] max-h-[200px] resize-none"
            disabled={loading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            size="icon"
            className="h-[60px] w-[60px] shrink-0"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}