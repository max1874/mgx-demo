import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Project = Database['public']['Tables']['projects']['Row'];

interface LayoutContextType {
  sidebarOpen: boolean;
  editorOpen: boolean;
  currentProject: Project | null;
  currentConversationId: string | null;
  currentFileId: string | null;
  projects: Project[];
  toggleSidebar: () => void;
  toggleEditor: () => void;
  setCurrentProject: (project: Project | null) => void;
  setCurrentConversation: (conversationId: string | null) => void;
  setCurrentFile: (fileId: string | null) => void;
  refreshProjects: () => Promise<void>;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editorOpen, setEditorOpen] = useState(true);
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const toggleEditor = () => setEditorOpen(prev => !prev);
  const setCurrentProject = (project: Project | null) => setCurrentProjectState(project);
  const setCurrentConversation = (conversationId: string | null) => setCurrentConversationId(conversationId);
  const setCurrentFile = (fileId: string | null) => setCurrentFileId(fileId);

  // Fetch user's projects with error handling
  const refreshProjects = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching projects:', error);
        // Don't throw, just log the error
        return;
      }
      
      setProjects(data || []);

      // If no current project and projects exist, select the first one
      if (!currentProject && data && data.length > 0) {
        setCurrentProjectState(data[0]);
      }
    } catch (error) {
      console.error('Error in refreshProjects:', error);
    }
  }, [user, currentProject]);

  // Load projects when user changes
  useEffect(() => {
    if (user) {
      refreshProjects();
    } else {
      setProjects([]);
      setCurrentProjectState(null);
    }
  }, [user, refreshProjects]);

  const value = {
    sidebarOpen,
    editorOpen,
    currentProject,
    currentConversationId,
    currentFileId,
    projects,
    toggleSidebar,
    toggleEditor,
    setCurrentProject,
    setCurrentConversation,
    setCurrentFile,
    refreshProjects,
  };

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};