import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut, User } from 'lucide-react';

function HomePage() {
  const { user, profile, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <header className="border-b bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            MGX Demo
          </h1>
          
          {user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" />
                <span className="font-medium">{profile?.username || user.email}</span>
                {profile && (
                  <span className="text-muted-foreground">
                    ({profile.credits} credits)
                  </span>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">
              Welcome to MGX Demo
            </h2>
            <p className="text-xl text-muted-foreground">
              AI-Powered Development Platform with Multi-Agent Collaboration
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
              <h3 className="text-xl font-semibold mb-2">🤖 AI Agents</h3>
              <p className="text-muted-foreground">
                Collaborate with specialized AI agents for different development tasks
              </p>
            </div>
            
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
              <h3 className="text-xl font-semibold mb-2">💬 Smart Chat</h3>
              <p className="text-muted-foreground">
                Interactive chat interface with context-aware responses
              </p>
            </div>
            
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
              <h3 className="text-xl font-semibold mb-2">📝 Code Editor</h3>
              <p className="text-muted-foreground">
                Built-in code editor with syntax highlighting and auto-completion
              </p>
            </div>
            
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
              <h3 className="text-xl font-semibold mb-2">🚀 Deploy</h3>
              <p className="text-muted-foreground">
                One-click deployment to production environments
              </p>
            </div>
          </div>

          {user && profile && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Your Account</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Username:</strong> {profile.username}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Credits:</strong> {profile.credits}</p>
                <p><strong>Subscription:</strong> {profile.subscription_tier}</p>
                <p><strong>Member since:</strong> {new Date(profile.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;