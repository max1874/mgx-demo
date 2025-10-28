import { LoginForm } from '@/components/auth/LoginForm';

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            MGX Demo
          </h1>
          <p className="text-muted-foreground mt-2">
            AI-Powered Development Platform
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}