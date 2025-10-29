/**
 * Sidebar Component
 * 
 * Left sidebar with conversation history.
 * Updated to show conversations directly without projects.
 */

import { useState } from 'react';
import { useLayout } from '@/contexts/LayoutContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Plus, Search, MessageSquare, Settings, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { createConversation, deleteConversation } from '@/lib/api/conversations';
import { formatDistanceToNow } from 'date-fns';

export function Sidebar() {
  const { user } = useAuth();
  const { 
    currentConversationId, 
    conversations, 
    setCurrentConversation, 
    refreshConversations,
    workspaceProjectId,
    ensureWorkspaceProject,
    workspaceLoading,
  } = useLayout();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateConversation = async () => {
    if (!user) return;

    setIsCreating(true);
    try {
      const projectId = workspaceProjectId || (await ensureWorkspaceProject());

      if (!projectId) {
        toast.error('Workspace project is not ready yet. Please try again shortly.');
        return;
      }

      const { data, error } = await createConversation({
        project_id: projectId,
        user_id: user.id,
        title: 'New Conversation',
        mode: 'team',
      });

      if (error) throw error;

      toast.success('Conversation created successfully');
      await refreshConversations(projectId);
      if (data) {
        setCurrentConversation(data.id);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to create conversation');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      const { error } = await deleteConversation(id);
      if (error) throw error;

      toast.success('Conversation deleted');
      
      // If deleted conversation was selected, clear selection
      if (currentConversationId === id) {
        setCurrentConversation(null);
      }
      
      await refreshConversations();
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  const filteredConversations = conversations.filter(conversation =>
    (conversation.title || 'Untitled Conversation')
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-64 border-r bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Conversations</h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleCreateConversation}
            disabled={isCreating || workspaceLoading}
            title="New conversation"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredConversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`group relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                currentConversationId === conversation.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
              onClick={() => setCurrentConversation(conversation.id)}
            >
              <MessageSquare className="h-4 w-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{conversation.title || 'Untitled Conversation'}</div>
                {conversation.updated_at && (
                  <div className="text-xs opacity-70 truncate">
                    {formatDistanceToNow(new Date(conversation.updated_at), { addSuffix: true })}
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleDeleteConversation(conversation.id, e)}
                title="Delete conversation"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}

          {filteredConversations.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t space-y-1">
        <Button variant="ghost" className="w-full justify-start" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>
    </div>
  );
}
