import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLayout } from '@/contexts/LayoutContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, MessageSquare, Folder, LogOut } from 'lucide-react';
import type { Database } from '@/types/database';

type Project = Database['public']['Tables']['projects']['Row'];
type Conversation = Database['public']['Tables']['conversations']['Row'];

export function Sidebar() {
  const { user, signOut } = useAuth();
  const { currentProjectId, currentConversationId, setCurrentProjectId, setCurrentConversationId } = useLayout();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Fetch projects
  useEffect(() => {
    if (!user) return;

    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
      } else {
        setProjects(data || []);
        // Auto-select first project if none selected
        if (!currentProjectId && data && data.length > 0) {
          setCurrentProjectId(data[0].id);
        }
      }
    };

    fetchProjects();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('projects')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'projects',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchProjects();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user, currentProjectId, setCurrentProjectId]);

  // Fetch conversations for current project
  useEffect(() => {
    if (!currentProjectId) {
      setConversations([]);
      return;
    }

    const fetchConversations = async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('project_id', currentProjectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
      } else {
        setConversations(data || []);
        // Auto-select first conversation if none selected
        if (!currentConversationId && data && data.length > 0) {
          setCurrentConversationId(data[0].id);
        }
      }
    };

    fetchConversations();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('conversations')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversations',
        filter: `project_id=eq.${currentProjectId}`,
      }, () => {
        fetchConversations();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentProjectId, currentConversationId, setCurrentConversationId]);

  const handleCreateProject = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: `New Project ${projects.length + 1}`,
        description: 'A new project',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating project:', error);
    } else if (data) {
      setCurrentProjectId(data.id);
    }
  };

  const handleCreateConversation = async () => {
    if (!user || !currentProjectId) return;

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        project_id: currentProjectId,
        title: `New Chat ${conversations.length + 1}`,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
    } else if (data) {
      setCurrentConversationId(data.id);
    }
  };

  return (
    <div className="w-64 border-r bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-4">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" opacity="0.3"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h1 className="text-xl font-bold">MGX Demo</h1>
        </div>
        <div className="text-sm text-muted-foreground">
          {user?.email}
        </div>
      </div>

      {/* Projects */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold">Projects</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCreateProject}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="h-32">
          <div className="space-y-1">
            {projects.map((project) => (
              <Button
                key={project.id}
                variant={currentProjectId === project.id ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setCurrentProjectId(project.id)}
              >
                <Folder className="h-4 w-4 mr-2" />
                <span className="truncate">{project.name}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* Conversations */}
      <div className="flex-1 p-4 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold">Conversations</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCreateConversation}
            disabled={!currentProjectId}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="space-y-1">
            {conversations.map((conversation) => (
              <Button
                key={conversation.id}
                variant={currentConversationId === conversation.id ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setCurrentConversationId(conversation.id)}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                <span className="truncate">{conversation.title}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Footer */}
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}