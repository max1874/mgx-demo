import React, { createContext, useContext, useState } from 'react';

interface LayoutContextType {
  sidebarOpen: boolean;
  editorOpen: boolean;
  currentProjectId: string | null;
  currentConversationId: string | null;
  currentFileId: string | null;
  toggleSidebar: () => void;
  toggleEditor: () => void;
  setCurrentProject: (projectId: string | null) => void;
  setCurrentConversation: (conversationId: string | null) => void;
  setCurrentFile: (fileId: string | null) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function LayoutProvider({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [editorOpen, setEditorOpen] = useState(true);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [currentFileId, setCurrentFileId] = useState<string | null>(null);

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  const toggleEditor = () => setEditorOpen(prev => !prev);
  const setCurrentProject = (projectId: string | null) => setCurrentProjectId(projectId);
  const setCurrentConversation = (conversationId: string | null) => setCurrentConversationId(conversationId);
  const setCurrentFile = (fileId: string | null) => setCurrentFileId(fileId);

  const value = {
    sidebarOpen,
    editorOpen,
    currentProjectId,
    currentConversationId,
    currentFileId,
    toggleSidebar,
    toggleEditor,
    setCurrentProject,
    setCurrentConversation,
    setCurrentFile,
  };

  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayout() {
  const context = useContext(LayoutContext);
  if (context === undefined) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
}