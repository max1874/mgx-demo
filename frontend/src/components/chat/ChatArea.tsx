import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLayout } from '@/contexts/LayoutContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { MessageBubble } from './MessageBubble';
import { AgentStatusIndicator } from './AgentStatusIndicator';
import { Send, Loader2, Plus, Upload, AtSign, User, Settings, ChevronDown, FileText, Search, BookOpen, Link } from 'lucide-react';
import type { Database } from '@/types/database';

type Message = Database['public']['Tables']['messages']['Row'];
type AgentName = 'Mike' | 'Emma' | 'Bob' | 'Alex' | 'David';
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

  // Initial empty state
  if (!currentConversationId || messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col bg-gradient-to-b from-white to-purple-50">
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          {/* Agent Avatars */}
          <div className="flex items-center gap-3 mb-8">
            {[
              { name: 'Alex', color: 'ring-orange-400' },
              { name: 'Emma', color: 'ring-purple-400' },
              { name: 'Bob', color: 'ring-green-400' },
              { name: 'Mike', color: 'ring-blue-400' },
              { name: 'David', color: 'ring-cyan-400' },
            ].map((agent) => (
              <div
                key={agent.name}
                className={`relative w-12 h-12 rounded-full ring-2 ${agent.color} ring-offset-2 overflow-hidden hover:scale-110 transition-transform cursor-pointer`}
              >
                <img
                  src={`/avatars/${agent.name.toLowerCase()}.png`}
                  alt={agent.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"%3E%3Ccircle cx="12" cy="12" r="10"/%3E%3Cpath d="M12 6v6l4 2"/%3E%3C/svg%3E';
                  }}
                />
              </div>
            ))}
            <button className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center hover:border-gray-400 hover:bg-gray-50 transition-colors">
              <Plus className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-semibold text-gray-900 mb-12">
            用智能体构建您的想法
          </h1>

          {/* Input Area */}
          <div className="w-full max-w-3xl">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-2 p-4 border-b border-gray-100">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500 hover:text-gray-700">
                  <Plus className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-green-500 hover:text-green-700">
                  <Upload className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500 hover:text-gray-700">
                  <AtSign className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500 hover:text-gray-700">
                  <User className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-500 hover:text-gray-700">
                  <Settings className="h-5 w-5" />
                </Button>
                
                <div className="flex-1" />
                
                <Button variant="ghost" className="h-9 px-3 text-sm font-medium text-gray-700 hover:text-gray-900">
                  Claude Sonnet 4.5
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </div>
              
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="@agent 聊天, # 选择文件。"
                className="min-h-[120px] border-0 focus-visible:ring-0 resize-none text-base px-4 py-4"
                disabled={loading}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-6 mt-8">
            <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors">
              <FileText className="h-4 w-4" />
              幻灯片
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors">
              <Search className="h-4 w-4" />
              深度研究
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors">
              <BookOpen className="h-4 w-4" />
              博客
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors">
              <Link className="h-4 w-4" />
              链接中心
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Chat view with messages
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