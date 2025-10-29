/**
 * Chat Area Component
 * 
 * Main chat interface with message list and input.
 * Integrates with Agent Orchestrator for AI-powered conversations.
 */

import { useState, useEffect, useRef } from 'react';
import { MessageList } from './MessageList';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  Paperclip, 
  Mic, 
  Image as ImageIcon,
  Loader2,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLayout } from '@/contexts/LayoutContext';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { AgentOrchestrator } from '@/lib/agents/AgentOrchestrator';
import { createConversation } from '@/lib/api/conversations';
import { toast } from 'sonner';

// Agent avatars for quick actions - using UI Avatars service
const agents = [
  { 
    name: 'Mike', 
    avatar: 'https://ui-avatars.com/api/?name=Mike&background=3b82f6&color=fff&size=128', 
    color: 'bg-blue-500', 
    title: 'Team Leader' 
  },
  { 
    name: 'Emma', 
    avatar: 'https://ui-avatars.com/api/?name=Emma&background=ec4899&color=fff&size=128', 
    color: 'bg-pink-500', 
    title: 'Product Manager' 
  },
  { 
    name: 'Bob', 
    avatar: 'https://ui-avatars.com/api/?name=Bob&background=a855f7&color=fff&size=128', 
    color: 'bg-purple-500', 
    title: 'System Architect' 
  },
  { 
    name: 'Alex', 
    avatar: 'https://ui-avatars.com/api/?name=Alex&background=22c55e&color=fff&size=128', 
    color: 'bg-green-500', 
    title: 'Full-stack Engineer' 
  },
  { 
    name: 'David', 
    avatar: 'https://ui-avatars.com/api/?name=David&background=f97316&color=fff&size=128', 
    color: 'bg-orange-500', 
    title: 'Data Analyst' 
  },
];

export function ChatArea() {
  const { user } = useAuth();
  const { currentProject, currentConversationId, setCurrentConversation } = useLayout();
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState<{
    agentName: string;
    content: string;
  } | null>(null);
  const [orchestratorError, setOrchestratorError] = useState<string | null>(null);
  
  const orchestratorRef = useRef<AgentOrchestrator | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get messages with realtime updates
  const { messages, loading, error } = useRealtimeMessages({
    conversationId: currentConversationId,
    enabled: !!currentConversationId,
  });

  // Initialize conversation when project is selected
  useEffect(() => {
    if (currentProject && user && !currentConversationId) {
      initializeConversation();
    }
  }, [currentProject, user, currentConversationId]);

  // Initialize orchestrator when conversation is ready
  useEffect(() => {
    if (currentConversationId && !orchestratorRef.current) {
      try {
        orchestratorRef.current = new AgentOrchestrator({
          conversationId: currentConversationId,
          onAgentMessage: (agentName, content) => {
            console.log(`Agent ${agentName} message:`, content);
          },
          onStreamChunk: (agentName, chunk) => {
            setStreamingMessage(prev => ({
              agentName,
              content: (prev?.content || '') + chunk,
            }));
          },
          onError: (error) => {
            console.error('Orchestrator error:', error);
            const message = error.message || 'Agent orchestrator encountered an error';
            setOrchestratorError(message);
            toast.error(`Error: ${message}`);
          },
        });
        setOrchestratorError(null);
      } catch (error) {
        console.error('Failed to initialize AgentOrchestrator:', error);
        const message =
          error instanceof Error
            ? error.message
            : 'Failed to initialize intelligent agents. Please check configuration.';
        setOrchestratorError(message);
        toast.error(message);
      }
    }

    return () => {
      if (orchestratorRef.current) {
        orchestratorRef.current.clear();
        orchestratorRef.current = null;
      }
    };
  }, [currentConversationId]);

  /**
   * Initialize or get existing conversation
   */
  const initializeConversation = async () => {
    if (!currentProject || !user) return;

    try {
      // Create a new conversation
      const { data, error } = await createConversation({
        project_id: currentProject.id,
        user_id: user.id,
        title: 'New Conversation',
      });

      if (error) throw error;
      if (data) {
        setCurrentConversation(data.id);
      }
    } catch (err) {
      console.error('Error initializing conversation:', err);
      toast.error('Failed to initialize conversation');
    }
  };

  /**
   * Handle sending message
   */
  const handleSend = async () => {
    if (!input.trim() || isSending || !orchestratorRef.current) return;

    const messageContent = input.trim();
    setInput('');
    setIsSending(true);
    setStreamingMessage(null);

    try {
      // Process with orchestrator
      await orchestratorRef.current.processUserRequest(messageContent);
      toast.success('Message sent successfully');
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
      setInput(messageContent); // Restore input on error
    } finally {
      setIsSending(false);
      setStreamingMessage(null);
    }
  };

  /**
   * Handle key press in textarea
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /**
   * Auto-resize textarea
   */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load messages</p>
          <Button onClick={initializeConversation} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (orchestratorError) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-2">
          <h2 className="text-lg font-semibold">AI workspace unavailable</h2>
          <p className="text-sm text-muted-foreground">{orchestratorError}</p>
          <p className="text-xs text-muted-foreground">
            Check that your environment variables include a valid LLM API key such as
            `VITE_OPENROUTER_API_KEY`, `VITE_OPENAI_API_KEY`, or `VITE_CLAUDE_API_KEY`, then reload.
          </p>
        </div>
      </div>
    );
  }

  // Initial empty state - centered input interface
  if (!currentConversationId || messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col bg-gradient-to-b from-white to-purple-50">
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          {/* Agent Avatars */}
          <div className="flex items-center mb-8">
            {agents.map((agent, index) => (
              <div
                key={agent.name}
                className="relative group cursor-pointer -ml-2.5 first:ml-0 transition-transform hover:scale-110 hover:z-50"
                style={{ zIndex: agents.length - index }}
              >
                <img 
                  src={agent.avatar} 
                  alt={agent.name}
                  className="w-14 h-14 rounded-full shadow-lg"
                />
                {/* Hover tooltip */}
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                    <div className="font-semibold">{agent.name}</div>
                    <div className="text-gray-300">{agent.title}</div>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
            ))}
            <Button
              variant="ghost"
              size="icon"
              className="w-14 h-14 -ml-2.5 rounded-full border-2 border-dashed border-gray-300 hover:border-gray-400 bg-white"
            >
              <Plus className="h-5 w-5 text-gray-400" />
            </Button>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-800 mb-12">
            Build Your Ideas with AI Agents
          </h1>

          {/* Input Area */}
          <div className="w-full max-w-3xl">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-4">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="@agent chat, # select files..."
                  className="min-h-[120px] border-0 resize-none focus-visible:ring-0 text-base"
                  disabled={isSending || !currentConversationId}
                />
              </div>
              
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Mic className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="ghost" className="h-9 px-3 text-sm font-medium">
                    Claude Sonnet 4.5
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isSending || !currentConversationId}
                    size="icon"
                    className="h-9 w-9 rounded-lg"
                  >
                    {isSending ? (
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
      </div>
    );
  }

  // Chat interface with messages
  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Messages */}
      <MessageList messages={messages} streamingMessage={streamingMessage} />

      {/* Input Area */}
      <div className="border-t bg-background p-4">
        <div className="max-w-4xl mx-auto">
          {/* Agent Avatars */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-muted-foreground">Quick actions:</span>
            {agents.map((agent) => (
              <button
                key={agent.name}
                className="relative group"
                title={`Ask ${agent.name}`}
                onClick={() => setInput(`@${agent.name} `)}
              >
                <img 
                  src={agent.avatar} 
                  alt={agent.name}
                  className="w-8 h-8 rounded-full hover:opacity-80 transition-opacity"
                />
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message... (Shift+Enter for new line)"
                className="min-h-[60px] max-h-[200px] resize-none pr-24"
                disabled={isSending || !currentConversationId}
              />
              
              {/* Attachment buttons */}
              <div className="absolute right-2 bottom-2 flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  title="Attach file"
                  disabled={isSending}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  title="Attach image"
                  disabled={isSending}
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  title="Voice input"
                  disabled={isSending}
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isSending || !currentConversationId}
              size="lg"
              className="px-6"
            >
              {isSending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>

          {/* Helper text */}
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {isSending
              ? 'Processing your request...'
              : 'Press Enter to send, Shift+Enter for new line'}
          </p>
        </div>
      </div>
    </div>
  );
}
