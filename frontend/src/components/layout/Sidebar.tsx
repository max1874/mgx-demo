import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLayout } from '@/contexts/LayoutContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, FolderOpen, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Database } from '@/types/database';

type Project = Database['public']['Tables']['projects']['Row'];
type Conversation = Database['public']['Tables']['conversations']['Row'];

export function Sidebar() {
  const { user } = useAuth();
  const { sidebarOpen, toggleSidebar, currentProjectId, currentConversationId, setCurrentProject, setCurrentConversation } = useLayout();
  const [projects, setProjects] = useState<Project[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch projects
  useEffect(() => {
    if (!user) return;

    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
      } else {
        setProjects(data || []);
      }
      setLoading(false);
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
  }, [user]);

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
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching conversations:', error);
      } else {
        setConversations(data || []);
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
  }, [currentProjectId]);

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
      setCurrentProject(data.id);
    }
  };

  const handleCreateConversation = async () => {
    if (!user || !currentProjectId) return;

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        project_id: currentProjectId,
        user_id: user.id,
        title: `New Conversation ${conversations.length + 1}`,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
    } else if (data) {
      setCurrentConversation(data.id);
    }
  };

  if (!sidebarOpen) {
    return (
      <div className="w-12 border-r bg-background flex flex-col items-center py-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-64 border-r bg-background flex flex-col">
      <div className="p-4 flex items-center justify-between border-b">
        <h2 className="text-lg font-semibold">Workspace</h2>
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Projects Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                <span className="text-sm font-medium">Projects</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCreateProject}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {loading ? (
                <p className="text-sm text-muted-foreground">Loading...</p>
              ) : projects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No projects yet</p>
              ) : (
                projects.map((project) => (
                  <Card
                    key={project.id}
                    className={`cursor-pointer transition-colors hover:bg-accent ${
                      currentProjectId === project.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => setCurrentProject(project.id)}
                  >
                    <CardHeader className="p-3">
                      <CardTitle className="text-sm">{project.name}</CardTitle>
                    </CardHeader>
                  </Card>
                ))
              )}
            </div>
          </div>

          <Separator />

          {/* Conversations Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm font-medium">Conversations</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCreateConversation}
                disabled={!currentProjectId}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              {!currentProjectId ? (
                <p className="text-sm text-muted-foreground">Select a project first</p>
              ) : conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No conversations yet</p>
              ) : (
                conversations.map((conversation) => (
                  <Card
                    key={conversation.id}
                    className={`cursor-pointer transition-colors hover:bg-accent ${
                      currentConversationId === conversation.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => setCurrentConversation(conversation.id)}
                  >
                    <CardContent className="p-3">
                      <p className="text-sm">{conversation.title}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}