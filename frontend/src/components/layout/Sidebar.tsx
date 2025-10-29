/**
 * Sidebar Component
 * 
 * Left sidebar with project list and conversation history.
 */

import { useState } from 'react';
import { useLayout } from '@/contexts/LayoutContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Plus, Search, MessageSquare, Folder, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function Sidebar() {
  const { user } = useAuth();
  const { currentProject, projects, setCurrentProject, refreshProjects } = useLayout();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateProject = async () => {
    if (!user) return;

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: `New Project ${projects.length + 1}`,
          description: 'A new project',
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Project created successfully');
      await refreshProjects();
      if (data) {
        setCurrentProject(data);
      }
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-64 border-r bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Projects</h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleCreateProject}
            disabled={isCreating}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Project List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filteredProjects.map((project) => (
            <button
              key={project.id}
              onClick={() => setCurrentProject(project)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                currentProject?.id === project.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
            >
              <Folder className="h-4 w-4 shrink-0" />
              <div className="flex-1 text-left truncate">
                <div className="font-medium truncate">{project.name}</div>
                {project.description && (
                  <div className="text-xs opacity-70 truncate">
                    {project.description}
                  </div>
                )}
              </div>
            </button>
          ))}

          {filteredProjects.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {searchQuery ? 'No projects found' : 'No projects yet'}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t space-y-1">
        <Button variant="ghost" className="w-full justify-start" size="sm">
          <MessageSquare className="h-4 w-4 mr-2" />
          Conversations
        </Button>
        <Button variant="ghost" className="w-full justify-start" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </div>
    </div>
  );
}