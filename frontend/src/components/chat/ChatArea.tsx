import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLayout } from '@/contexts/LayoutContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { MessageBubble } from './MessageBubble';
import { AgentStatusIndicator } from './AgentStatusIndicator';
import { Send, Loader2, Plus, ChevronDown } from 'lucide-react';
import type { Database } from '@/types/database';

type Message = Database['public']['Tables']['messages']['Row'];
type AgentName = 'Mike' | 'Emma' | 'Bob' | 'Alex' | 'David';
type AgentState = 'idle' | 'thinking' | 'executing' | 'completed' | 'failed';

const agents = [
  { name: 'Mike', avatar: '/avatars/mike.png', borderColor: 'border-orange-400' },
  { name: 'Alex', avatar: '/avatars/alex.png', borderColor: 'border-purple-400' },
  { name: 'Emma', avatar: '/avatars/emma.png', borderColor: 'border-green-400' },
  { name: 'David', avatar: '/avatars/david.png', borderColor: 'border-orange-400' },
  { name: 'Bob', avatar: '/avatars/bob.png', borderColor: 'border-cyan-400' },
];

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
          topic: 'chat',
          role: 'user',
          extension: 'txt',
          content: messageContent,
        });

      if (insertError) {
        console.error('Error sending message:', insertError);
        setInput(messageContent);
        return;
      }

      // Simulate agent response
      setCurrentAgent('Alex');
      setAgentState('thinking');
      
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
            
            supabase.from('messages').insert({
              conversation_id: currentConversationId,
              topic: 'chat',
              role: 'assistant',
              agent_name: 'Alex',
              extension: 'txt',
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

  // Initial empty state - centered input interface
  if (!currentConversationId || messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col bg-gradient-to-b from-white to-purple-50">
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          {/* Agent Avatars */}
          <div className="flex items-center gap-4 mb-8">
            {agents.map((agent) => (
              <div
                key={agent.name}
                className="relative group cursor-pointer"
              >
                <div className={`w-16 h-16 rounded-full overflow-hidden border-4 ${agent.borderColor} shadow-lg transition-transform hover:scale-110`}>
                  <img
                    src={agent.avatar}
                    alt={agent.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/avatars/default.png';
                    }}
                  />
                </div>
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs font-medium text-gray-600 whitespace-nowrap bg-white px-2 py-1 rounded shadow-sm">
                    {agent.name}
                  </span>
                </div>
              </div>
            ))}
            <Button
              variant="ghost"
              size="icon"
              className="w-16 h-16 rounded-full border-4 border-dashed border-gray-300 hover:border-gray-400"
            >
              <Plus className="h-6 w-6 text-gray-400" />
            </Button>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-800 mb-12 mt-12">
            用智能体构建您的想法
          </h1>

          {/* Input Area */}
          <div className="w-full max-w-3xl">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-4">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="@agent 聊天, # 选择文件。"
                  className="min-h-[120px] border-0 resize-none focus-visible:ring-0 text-base"
                  disabled={loading}
                />
              </div>
              
              {/* Toolbar */}
              <div className="flex items-center justify-end px-4 py-3 border-t border-gray-100 gap-3">
                <Button
                  variant="ghost"
                  className="h-9 px-3 text-sm font-medium"
                >
                  Claude Sonnet 4.5
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  size="icon"
                  className="h-9 w-9 rounded-lg"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Chat interface with messages
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
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              role={message.role as 'user' | 'assistant'}
              content={message.content}
              agentName={(message.agent_name as AgentName) || undefined}
              timestamp={message.created_at || undefined}
            />
          ))}
          
          {streamingMessage && (
            <MessageBubble
              role="assistant"
              content={streamingMessage.content}
              agentName={streamingMessage.agentName}
            />
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