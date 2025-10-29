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
type Agent = Database['public']['Tables']['agents']['Row'];

export function Sidebar() {
  const { user } = useAuth();
  const { sidebarOpen, toggleSidebar, currentProjectId, setCurrentProject, setCurrentConversation } = useLayout();
  const [projects, setProjects] = useState<Project[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
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

  // Fetch agents
  useEffect(() => {
    const fetchAgents = async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching agents:', error);
      } else {
        setAgents(data || []);
      }
      setLoading(false);
    };

    fetchAgents();
  }, []);

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
                    className="cursor-pointer transition-colors hover:bg-accent"
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

          <Separator />

          {/* Agents Section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <svg width="1em" height="1em" viewBox="0 0 39 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4">
                <path d="M7.25323 10.0885L5.77833 10.9996C5.76336 11.1072 5.75561 11.2173 5.75561 11.3295C5.75561 12.5072 6.61096 13.4621 7.66623 13.4621C8.70318 13.4621 9.54736 12.5399 9.57633 11.3904C10.0392 11.6256 10.5571 11.7704 11.106 11.8003C10.8096 13.6202 9.38238 15 7.66623 15C5.73529 15 4.16979 13.2532 4.16971 11.0982C4.16971 9.82687 4.71463 8.69719 5.55789 7.98477L5.56409 7.97651L7.25323 10.0885Z"></path>
                <path d="M28.3686 4.65036C28.9975 4.65036 29.5428 4.79397 30.0036 5.08039C30.4704 5.36053 30.7848 5.72153 30.9467 6.16346L29.826 6.80825C29.689 6.52187 29.4927 6.29747 29.2375 6.13559C28.9822 5.96757 28.68 5.88317 28.3314 5.88314C27.9642 5.8832 27.6338 5.97677 27.3413 6.16346C27.0487 6.35028 26.8181 6.61859 26.65 6.96726C26.482 7.31593 26.3976 7.72075 26.3976 8.18146C26.3976 8.65462 26.482 9.06558 26.65 9.41425C26.8244 9.76291 27.0672 10.0312 27.3785 10.218C27.696 10.4048 28.064 10.4983 28.4812 10.4984C28.9667 10.4983 29.3466 10.3639 29.6205 10.0962V8.98473H28.3314V7.81699H30.9467V10.6006C30.735 10.943 30.3957 11.2175 29.9287 11.423C29.468 11.6222 28.9568 11.7219 28.3965 11.7219C27.7304 11.7218 27.1389 11.572 26.6222 11.2732C26.1054 10.9743 25.7032 10.5569 25.4167 10.0214C25.1304 9.48591 24.9872 8.87251 24.9872 8.18146C24.9872 7.4841 25.1334 6.86725 25.426 6.33176C25.7249 5.79637 26.1334 5.38234 26.65 5.08968C27.1668 4.7971 27.7398 4.65041 28.3686 4.65036Z"></path>
                <path d="M34.8108 7.03282L36.3802 4.77219H37.9496L35.5485 8.1066L38.0616 11.6093H36.3802L34.7179 9.20878L33.0458 11.6093H31.4764L33.9797 8.13448L31.5884 4.77219H33.242L34.8108 7.03282Z"></path>
                <path d="M20.293 8.19075L22.6187 4.65036H23.646V11.488H22.3575V7.07876L20.6198 9.66669H19.91L18.163 7.06018V11.488H16.8832V4.65036H17.9575L20.293 8.19075Z"></path>
                <path d="M11.4947 4.51355C12.1959 4.51355 13.0335 4.73223 13.7403 5.18157C14.4594 5.63869 15.1116 6.38443 15.2504 7.4453C15.499 9.34676 14.2869 10.8026 12.8297 11.25C12.5112 11.3478 12.1411 11.416 11.7409 11.4353C11.4087 11.3928 10.9912 11.2832 10.5655 11.0285C9.36753 10.3119 8.76122 9.45199 7.7989 7.99974H7.41533C8.30923 9.31546 9.63256 11.1907 11.52 11.441C10.2803 11.444 8.80363 10.9692 7.69411 9.48497L7.59912 9.35746C7.20001 8.82342 6.86389 8.37411 6.56043 7.99458H6.54959C6.48475 7.90793 6.41892 7.81988 6.35239 7.73078L6.20165 7.52944C5.20054 6.1903 3.78419 6.1302 2.96119 6.38287C2.21991 6.61051 1.62241 7.33559 1.74956 8.30794C1.80479 8.73011 2.06046 9.07409 2.47127 9.33526C2.89422 9.60415 3.58353 9.60366 4.19501 9.46794L3.78821 11.4642C3.08699 11.4642 2.24939 11.2456 1.54255 10.7962C0.82353 10.3391 0.171326 9.59338 0.032539 8.53251C-0.216126 6.63106 0.996023 5.17517 2.4532 4.72779C2.73529 4.64119 3.05808 4.57755 3.40619 4.55072C3.74856 4.58657 4.19473 4.69321 4.65033 4.96578C5.84826 5.68247 6.45405 6.54233 7.41637 7.99458H7.80045C6.8891 6.65317 5.53107 4.73004 3.58429 4.5404C4.85858 4.48998 6.42549 4.93666 7.58879 6.49283L7.68378 6.61982C8.08298 7.154 8.41895 7.60362 8.72246 7.98322H8.7333C8.79814 8.06987 8.86398 8.15792 8.93051 8.24702L9.08125 8.44836C10.0824 9.78754 11.4987 9.84761 12.3217 9.59493C13.063 9.3673 13.6605 8.64224 13.5333 7.66986C13.4781 7.24775 13.2223 6.90422 12.8116 6.64305C12.3887 6.37416 11.6994 6.37413 11.0879 6.50986L11.4947 4.51355Z"></path>
                <path d="M7.61409 1C9.545 1.0001 11.1101 2.74728 11.1101 4.90228C11.11 6.17815 10.5616 7.31104 9.71313 8.02297L8.02192 5.90947L9.50302 4.99469C9.51744 4.88909 9.5247 4.78059 9.5247 4.67049C9.52466 3.4928 8.66933 2.53789 7.61409 2.53789C6.60542 2.53796 5.77954 3.41055 5.70863 4.51613C5.24948 4.279 4.73563 4.13256 4.19139 4.10004C4.52283 2.32978 5.92947 1 7.61409 1Z"></path>
              </svg>
              <span className="text-sm font-medium">AI Agents</span>
            </div>
            <div className="space-y-2">
              {agents.map((agent) => (
                <Card key={agent.id} className="overflow-hidden">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <img 
                        src={agent.avatar_url || '/avatars/default.png'} 
                        alt={agent.display_name}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/avatars/default.png';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{agent.display_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{agent.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}