import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getConversationsByUser } from '@/lib/api/conversations';
import type { Database } from '@/types/database';

type Conversation = Database['public']['Tables']['conversations']['Row'];

interface LayoutContextType {
  sidebarOpen: boolean;
  editorOpen: boolean;
  currentConversationId: string | null;
  currentFileId: string | null;
  conversations: Conversation[];
  toggleSidebar: () => void;
  toggleEditor: () => void;
  setCurrentConversation: (conversationId: string | null) => void;
  setCurrentFile: (fileId: string | null) => void;
  refreshConversations: () => Promise<void>;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editorOpen, setEditorOpen] = useState(true);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const toggleEditor = () => setEditorOpen(prev => !prev);
  const setCurrentConversation = (conversationId: string | null) => setCurrentConversationId(conversationId);
  const setCurrentFile = (fileId: string | null) => setCurrentFileId(fileId);

  // Fetch user's conversations with error handling
  const refreshConversations = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await getConversationsByUser(user.id);

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
  }, [user, currentConversationId]);

  // Load conversations when user changes
  useEffect(() => {
    if (user) {
      refreshConversations();
    } else {
      setConversations([]);
      setCurrentConversationId(null);
    }
  }, [user, refreshConversations]);

  const value = {
    sidebarOpen,
    editorOpen,
    currentConversationId,
    currentFileId,
    conversations,
    toggleSidebar,
    toggleEditor,
    setCurrentConversation,
    setCurrentFile,
    refreshConversations,
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