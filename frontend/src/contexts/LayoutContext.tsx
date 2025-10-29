import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getConversationsByProject } from '@/lib/api/conversations';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type Conversation = Database['public']['Tables']['conversations']['Row'];

export type AgentMode = 'team' | 'engineer';

interface LayoutContextType {
  sidebarOpen: boolean;
  editorOpen: boolean;
  currentConversationId: string | null;
  currentFileId: string | null;
  conversations: Conversation[];
  workspaceProjectId: string | null;
  workspaceLoading: boolean;
  mode: AgentMode;
  toggleSidebar: () => void;
  toggleEditor: () => void;
  setCurrentConversation: (conversationId: string | null) => void;
  setCurrentFile: (fileId: string | null) => void;
  setMode: (mode: AgentMode) => void;
  refreshConversations: (projectId?: string) => Promise<void>;
  ensureWorkspaceProject: () => Promise<string | null>;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editorOpen, setEditorOpen] = useState(true);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [workspaceProjectId, setWorkspaceProjectId] = useState<string | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [mode, setModeState] = useState<AgentMode>('team');

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const toggleEditor = () => setEditorOpen(prev => !prev);
  const setCurrentConversation = (conversationId: string | null) => setCurrentConversationId(conversationId);
  const setCurrentFile = (fileId: string | null) => setCurrentFileId(fileId);
  const setMode = (newMode: AgentMode) => {
    console.log('🔄 Switching mode to:', newMode);
    setModeState(newMode);
  };

  const ensureWorkspaceProject = useCallback(async (): Promise<string | null> => {
    if (!user) return null;

    if (workspaceProjectId) {
      return workspaceProjectId;
    }

    try {
      setWorkspaceLoading(true);

      const { data: existingProjects, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1);

      if (projectError) throw projectError;

      if (existingProjects && existingProjects.length > 0) {
        const projectId = existingProjects[0].id;
        setWorkspaceProjectId(projectId);
        return projectId;
      }

      const { data: newProject, error: createError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: 'My Workspace',
          description: 'Auto-created workspace project',
          permission: 'private',
        })
        .select('id')
        .single();

      if (createError) throw createError;

      if (newProject) {
        setWorkspaceProjectId(newProject.id);
        return newProject.id;
      }

      return null;
    } catch (error) {
      console.error('Error ensuring workspace project:', error);
      return null;
    } finally {
      setWorkspaceLoading(false);
    }
  }, [user, workspaceProjectId]);

  // Fetch user's conversations with error handling
  const refreshConversations = useCallback(async (projectIdOverride?: string) => {
    if (!user) return;

    try {
      const projectId =
        projectIdOverride ||
        workspaceProjectId ||
        (await ensureWorkspaceProject());

      if (!projectId) return;

      const { data, error } = await getConversationsByProject(projectId);

      if (error) {
        console.error('Error fetching conversations:', error);
        return;
      }
      
      setConversations(data || []);

      // If no current conversation and conversations exist, select the first one
      if (!currentConversationId && data && data.length > 0) {
        setCurrentConversationId(data[0].id);
      }
    } catch (error) {
      console.error('Error in refreshConversations:', error);
    }
  }, [user, currentConversationId, workspaceProjectId, ensureWorkspaceProject]);

  // Load conversations when user changes
  useEffect(() => {
    if (user) {
      (async () => {
        const projectId = await ensureWorkspaceProject();
        if (projectId) {
          await refreshConversations(projectId);
        }
      })();
    } else {
      setConversations([]);
      setCurrentConversationId(null);
      setWorkspaceProjectId(null);
      setWorkspaceLoading(false);
    }
  }, [user, ensureWorkspaceProject, refreshConversations]);

  // Subscribe to real-time conversation updates
  useEffect(() => {
    if (!workspaceProjectId) return;

    console.log('📡 LayoutContext: Setting up realtime subscription for conversations');

    const channel = supabase
      .channel(`conversations:${workspaceProjectId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'conversations',
          filter: `project_id=eq.${workspaceProjectId}`,
        },
        async (payload) => {
          console.log('🔔 LayoutContext: Conversation changed:', payload);

          // Refresh conversations to get the latest data
          await refreshConversations(workspaceProjectId);
        }
      )
      .subscribe();

    return () => {
      console.log('🔌 LayoutContext: Cleaning up realtime subscription');
      channel.unsubscribe();
    };
  }, [workspaceProjectId, refreshConversations]);

  const value = {
    sidebarOpen,
    editorOpen,
    currentConversationId,
    currentFileId,
    conversations,
    workspaceProjectId,
    workspaceLoading,
    mode,
    toggleSidebar,
    toggleEditor,
    setCurrentConversation,
    setCurrentFile,
    setMode,
    refreshConversations,
    ensureWorkspaceProject,
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
