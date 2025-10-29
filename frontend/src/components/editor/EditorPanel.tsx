/**
 * Editor Panel Component
 * 
 * Right panel for viewing and editing project files.
 * Updated to work with conversations instead of projects.
 */

import { useState, useEffect } from 'react';
import { useLayout } from '@/contexts/LayoutContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { File, Folder, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

type FileType = Database['public']['Tables']['files']['Row'];

export function EditorPanel() {
  const { currentConversationId, currentFileId, setCurrentFile, toggleEditor } = useLayout();
  const [files, setFiles] = useState<FileType[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch files for current conversation
  useEffect(() => {
    if (!currentConversationId) {
      setFiles([]);
      return;
    }

    const fetchFiles = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('files')
          .select('*')
          .eq('conversation_id', currentConversationId)
          .order('path');

        if (error) throw error;
        setFiles(data || []);
      } catch (error) {
        console.error('Error fetching files:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [currentConversationId]);

  const currentFile = files.find(f => f.id === currentFileId);

  if (!currentConversationId) {
    return (
      <div className="w-96 border-l bg-background flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Editor</h2>
          <Button variant="ghost" size="icon" onClick={toggleEditor}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          <p>No conversation selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 border-l bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold">Editor</h2>
        <Button variant="ghost" size="icon" onClick={toggleEditor}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <Tabs defaultValue="files" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="flex-1 mt-0">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : files.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>No files yet</p>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="p-4 space-y-1">
                {files.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => setCurrentFile(file.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      currentFileId === file.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <File className="h-4 w-4 shrink-0" />
                    <span className="truncate">{file.path}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="preview" className="flex-1 mt-0">
          {currentFile ? (
            <ScrollArea className="h-full">
              <div className="p-4">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Folder className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{currentFile.path}</span>
                  </div>
                  {currentFile.language && (
                    <span className="text-xs text-muted-foreground">
                      Language: {currentFile.language}
                    </span>
                  )}
                </div>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <code className="text-sm">{currentFile.content}</code>
                </pre>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p>Select a file to preview</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}