import { useEffect, useState } from 'react';
import { useLayout } from '@/contexts/LayoutContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, ChevronRight, FileCode, FolderTree } from 'lucide-react';
import type { Database } from '@/types/database';

type File = Database['public']['Tables']['files']['Row'];

export function EditorPanel() {
  const { editorOpen, toggleEditor, currentProjectId, currentFileId, setCurrentFile } = useLayout();
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentFileContent, setCurrentFileContent] = useState<string>('');

  // Fetch files for current project
  useEffect(() => {
    if (!currentProjectId) {
      setFiles([]);
      setLoading(false);
      return;
    }

    const fetchFiles = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('project_id', currentProjectId)
        .order('path');

      if (error) {
        console.error('Error fetching files:', error);
      } else {
        setFiles(data || []);
      }
      setLoading(false);
    };

    fetchFiles();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('files')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'files',
        filter: `project_id=eq.${currentProjectId}`,
      }, () => {
        fetchFiles();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [currentProjectId]);

  // Fetch current file content
  useEffect(() => {
    if (!currentFileId) {
      setCurrentFileContent('');
      return;
    }

    const file = files.find(f => f.id === currentFileId);
    if (file) {
      setCurrentFileContent(file.content || '');
    }
  }, [currentFileId, files]);

  if (!editorOpen) {
    return (
      <div className="w-12 border-l bg-background flex flex-col items-center py-4">
        <Button variant="ghost" size="icon" onClick={toggleEditor}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-96 border-l bg-background flex flex-col">
      <div className="p-4 flex items-center justify-between border-b">
        <h2 className="text-lg font-semibold">Editor</h2>
        <Button variant="ghost" size="icon" onClick={toggleEditor}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {!currentProjectId ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-muted-foreground text-center">
            Select a project to view files
          </p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col">
          {/* File Tree */}
          <div className="border-b">
            <div className="p-3 flex items-center gap-2 bg-muted/50">
              <FolderTree className="h-4 w-4" />
              <span className="text-sm font-medium">Files</span>
            </div>
            <ScrollArea className="h-48">
              <div className="p-2 space-y-1">
                {loading ? (
                  <p className="text-sm text-muted-foreground p-2">Loading files...</p>
                ) : files.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">No files yet</p>
                ) : (
                  files.map((file) => (
                    <Button
                      key={file.id}
                      variant={currentFileId === file.id ? 'secondary' : 'ghost'}
                      className="w-full justify-start text-sm"
                      onClick={() => setCurrentFile(file.id)}
                    >
                      <FileCode className="h-4 w-4 mr-2" />
                      {file.path}
                    </Button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          <Separator />

          {/* Code Viewer */}
          <div className="flex-1 flex flex-col">
            <div className="p-3 bg-muted/50">
              <span className="text-sm font-medium">
                {currentFileId
                  ? files.find(f => f.id === currentFileId)?.path || 'Untitled'
                  : 'No file selected'}
              </span>
            </div>
            <ScrollArea className="flex-1">
              {currentFileId ? (
                <pre className="p-4 text-sm font-mono">
                  <code>{currentFileContent || '// Empty file'}</code>
                </pre>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  <p className="text-sm">Select a file to view its content</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      )}
    </div>
  );
}