/**
 * Chat Area Component
 * 
 * Main chat interface with message list and input.
 * Integrates with Agent Orchestrator for AI-powered conversations.
 * Updated with optimistic UI updates for better UX.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { MessageList } from './MessageList';
import { ModelSelector } from './ModelSelector';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  Paperclip, 
  Mic, 
  Image as ImageIcon,
  Loader2,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLayout } from '@/contexts/LayoutContext';
import { useModel } from '@/contexts/ModelContext';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { AgentOrchestrator } from '@/lib/agents/AgentOrchestrator';
import { createConversation } from '@/lib/api/conversations';
import { toast } from 'sonner';
import type { Database } from '@/types/database';

type Message = Database['public']['Tables']['messages']['Row'];

// Pending message type for optimistic updates
interface PendingMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  agent_name?: string;
  conversation_id: string;
  created_at: string;
  isPending: true;
}

interface QueuedMessage {
  id: string;
  content: string;
  conversationId: string;
}

// Agent avatars for quick actions - using local image assets
const agents = [
  {
    name: 'Mike',
    avatar: '/images/Mike-TeamLeader-Avatar.BVQZLCeX.png',
    color: 'bg-blue-500',
    title: 'Team Leader'
  },
  {
    name: 'Emma',
    avatar: '/images/Emma-ProductManager-Avatar.DAgh_sAa.png',
    color: 'bg-pink-500',
    title: 'Product Manager'
  },
  {
    name: 'Bob',
    avatar: '/images/Bob-Architect-Avatar.Dwg49-6j.png',
    color: 'bg-purple-500',
    title: 'System Architect'
  },
  {
    name: 'Alex',
    avatar: '/images/Alex-Engineer-Avatar.DMF78Ta0.png',
    color: 'bg-green-500',
    title: 'Full-stack Engineer'
  },
  {
    name: 'David',
    avatar: '/images/David-DataAnalyst-Avatar.JI1m4RZ8.png',
    color: 'bg-orange-500',
    title: 'Data Analyst'
  },
];

export function ChatArea() {
  const { user } = useAuth();
  const { 
    currentConversationId, 
    setCurrentConversation, 
    refreshConversations,
    workspaceProjectId,
    ensureWorkspaceProject,
  } = useLayout();
  const { selectedModel, modelConfig, isChanging } = useModel();
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const [streamingMessage, setStreamingMessage] = useState<{
    agentName: string;
    content: string;
  } | null>(null);
  const [orchestratorError, setOrchestratorError] = useState<string | null>(null);
  
  const orchestratorRef = useRef<AgentOrchestrator | null>(null);
  const messageQueueRef = useRef<QueuedMessage[]>([]);
  const isProcessingRef = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get messages with realtime updates
  const { messages, loading, error, refetch: refetchMessages } = useRealtimeMessages({
    conversationId: currentConversationId,
    enabled: !!currentConversationId,
  });

  // Combine real messages with pending messages (with deduplication)
  const allMessages = (() => {
    // Create a set of message signatures (content + role + agent) to detect duplicates
    const messageSignatures = new Set(
      messages.map(m => `${m.role}:${m.agent_name || ''}:${m.content}`)
    );

    // Only include pending messages that aren't already in the real messages
    // Check by both ID and content signature to handle race conditions
    const uniquePendingMessages = pendingMessages
      .filter(pm => {
        const signature = `${pm.role}:${pm.agent_name || ''}:${pm.content}`;
        return !messageSignatures.has(signature);
      })
      .map(msg => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        role: msg.role,
        agent_name: msg.agent_name ?? null,
        content: msg.content,
        metadata: null,
        created_at: msg.created_at,
      } as Message));

    // Combine and deduplicate final list by content signature
    const allMsgs = [...messages, ...uniquePendingMessages];
    const seen = new Set<string>();
    const deduplicated = allMsgs.filter(msg => {
      const signature = `${msg.role}:${msg.agent_name || ''}:${msg.content}`;
      if (seen.has(signature)) {
        return false;
      }
      seen.add(signature);
      return true;
    });

    return deduplicated.sort(
      (a, b) =>
        new Date(a.created_at || 0).getTime() -
        new Date(b.created_at || 0).getTime()
    );
  })();

  const processQueue = useCallback(async () => {
    if (isProcessingRef.current) return;
    if (!orchestratorRef.current) return;

    isProcessingRef.current = true;
    setIsSending(true);

    while (messageQueueRef.current.length > 0) {
      if (!orchestratorRef.current) {
        break;
      }

      const queued = messageQueueRef.current[0];

      if (queued.conversationId !== currentConversationId) {
        setPendingMessages(prev => prev.filter(msg => msg.id !== queued.id));
        messageQueueRef.current.shift();
        continue;
      }

      try {
        await orchestratorRef.current.processUserRequest(queued.content);
        setPendingMessages(prev => prev.filter(msg => msg.id !== queued.id));
        await refetchMessages();
      } catch (err) {
        console.error('Error sending message:', err);
        toast.error('Failed to send message');
        setPendingMessages(prev => prev.filter(msg => msg.id !== queued.id));
        setInput(prev => prev || queued.content);
      } finally {
        messageQueueRef.current.shift();
        setStreamingMessage(null);
      }
    }

    if (messageQueueRef.current.length === 0) {
      setIsSending(false);
    }

    isProcessingRef.current = false;
  }, [currentConversationId, refetchMessages]);

  // Initialize orchestrator when conversation or model changes
  useEffect(() => {
    if (currentConversationId) {
      // Clear existing orchestrator
      if (orchestratorRef.current) {
        orchestratorRef.current.clear();
        orchestratorRef.current = null;
      }

      try {
        orchestratorRef.current = new AgentOrchestrator({
          conversationId: currentConversationId,
          modelType: selectedModel,
          onAgentMessage: (agentName, content) => {
            console.log(`Agent ${agentName} message:`, content);
            setStreamingMessage(null);
            refetchMessages();
          },
          onStreamChunk: (agentName, chunk) => {
            setStreamingMessage(prev => {
              // If agent changed, reset content and start fresh
              if (prev && prev.agentName !== agentName) {
                return { agentName, content: chunk };
              }
              // Otherwise, append to existing content
              return {
                agentName,
                content: (prev?.content || '') + chunk,
              };
            });
          },
          onError: (error) => {
            console.error('Orchestrator error:', error);
            const message = error.message || 'Agent orchestrator encountered an error';
            setOrchestratorError(message);
            toast.error(`Error: ${message}`);
            setIsSending(false);
          },
        });
        setOrchestratorError(null);
        console.log(`Orchestrator initialized with model: ${modelConfig.displayName}`);
        processQueue();
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
  }, [currentConversationId, selectedModel, modelConfig, refetchMessages, processQueue]);

  /**
   * Initialize or create new conversation
   */
  const initializeConversation = async (): Promise<string | null> => {
    if (!user) return null;

    try {
      const projectId = workspaceProjectId || (await ensureWorkspaceProject());
      if (!projectId) {
        toast.error('Workspace project is not ready yet. Please try again.');
        return null;
      }

      // Create a new conversation
      const { data, error } = await createConversation({
        project_id: projectId,
        user_id: user.id,
        title: 'New Conversation',
        mode: 'team',
      });

      if (error) throw error;
      if (data) {
        setCurrentConversation(data.id);
        await refreshConversations(projectId);
        return data.id;
      }
    } catch (err) {
      console.error('Error initializing conversation:', err);
      toast.error('Failed to initialize conversation');
    }

    return null;
  };

  /**
   * Handle sending message with optimistic update
   */
  const handleSend = async () => {
    if (!input.trim() || isChanging) return;

    let activeConversationId = currentConversationId;

    // If no conversation, create one first
    if (!activeConversationId) {
      activeConversationId = await initializeConversation();
      if (!activeConversationId) {
        return;
      }
    }

    const messageContent = input.trim();
    setInput('');
    setStreamingMessage(null);

    // Add optimistic user message
    const pendingUserMessage: PendingMessage = {
      id: `pending-${Date.now()}`,
      role: 'user',
      content: messageContent,
      conversation_id: activeConversationId,
      created_at: new Date().toISOString(),
      isPending: true,
    };
    setPendingMessages(prev => [...prev, pendingUserMessage]);

    messageQueueRef.current.push({
      id: pendingUserMessage.id,
      content: messageContent,
      conversationId: activeConversationId,
    });

    processQueue();
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
            `VITE_OPENROUTER_API_KEY`, then reload.
          </p>
        </div>
      </div>
    );
  }

  // Initial empty state - centered input interface
  if (!currentConversationId || allMessages.length === 0) {
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
                  disabled={isChanging}
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
                  <ModelSelector />
                  <Button
                    onClick={handleSend}
                    disabled={!input.trim() || isChanging}
                    size="icon"
                    className="h-9 w-9 rounded-lg"
                  >
                    {isSending || isChanging ? (
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
      <MessageList messages={allMessages} streamingMessage={streamingMessage} />

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
                disabled={isChanging}
              />
              
              {/* Attachment buttons */}
              <div className="absolute right-2 bottom-2 flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  title="Attach file"
                  disabled={isChanging}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  title="Attach image"
                  disabled={isChanging}
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  title="Voice input"
                  disabled={isChanging}
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Send Button */}
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isChanging}
              size="lg"
              className="px-6"
            >
              {isSending || isChanging ? (
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
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">
              {isSending
                ? 'Processing your request...'
                : isChanging
                ? 'Switching model...'
                : 'Press Enter to send, Shift+Enter for new line'}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Using:</span>
              <ModelSelector />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}