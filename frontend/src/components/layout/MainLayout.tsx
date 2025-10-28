import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LayoutProvider } from '@/contexts/LayoutContext';
import { Sidebar } from './Sidebar';
import { ChatArea } from '@/components/chat/ChatArea';
import { EditorPanel } from '@/components/editor/EditorPanel';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

export function MainLayout() {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <LayoutProvider>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="border-b bg-background">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold">MGX Demo</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="text-sm">{profile?.username || user.email}</span>
                <span className="text-xs text-muted-foreground">
                  ({profile?.credits || 0} credits)
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <Sidebar />

          {/* Chat Area */}
          <ChatArea />

          {/* Editor Panel */}
          <EditorPanel />
        </div>
      </div>
    </LayoutProvider>
  );
}