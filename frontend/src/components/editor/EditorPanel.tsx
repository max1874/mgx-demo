/**
 * Editor Panel Component
 * 
 * Right panel with code editor and file tree.
 */

import { useState } from 'react';
import { useLayout } from '@/contexts/LayoutContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Code, Terminal, X } from 'lucide-react';

export function EditorPanel() {
  const { currentProject, toggleEditor } = useLayout();
  const [activeTab, setActiveTab] = useState('files');

  if (!currentProject) {
    return (
      <div className="w-96 border-l bg-background flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Select a project to view files</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 border-l bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Editor</h2>
        <Button size="icon" variant="ghost" onClick={toggleEditor}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b px-4">
          <TabsTrigger value="files" className="gap-2">
            <FileText className="h-4 w-4" />
            Files
          </TabsTrigger>
          <TabsTrigger value="code" className="gap-2">
            <Code className="h-4 w-4" />
            Code
          </TabsTrigger>
          <TabsTrigger value="terminal" className="gap-2">
            <Terminal className="h-4 w-4" />
            Terminal
          </TabsTrigger>
        </TabsList>

        <TabsContent value="files" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <div className="text-sm text-muted-foreground text-center py-8">
                No files yet
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="code" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4">
              <div className="text-sm text-muted-foreground text-center py-8">
                Select a file to edit
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="terminal" className="flex-1 m-0">
          <ScrollArea className="h-full">
            <div className="p-4 font-mono text-sm">
              <div className="text-muted-foreground">
                $ Terminal output will appear here
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}