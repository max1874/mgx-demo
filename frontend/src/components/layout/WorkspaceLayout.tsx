/**
 * Workspace Layout Component
 * 
 * Main layout for the application workspace.
 */

import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { ChatArea } from '../chat/ChatArea';
import { EditorPanel } from '../editor/EditorPanel';
import { useLayout } from '@/contexts/LayoutContext';

export function WorkspaceLayout() {
  const { sidebarOpen, editorOpen } = useLayout();

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        {sidebarOpen && <Sidebar />}
        <ChatArea />
        {editorOpen && <EditorPanel />}
      </div>
    </div>
  );
}