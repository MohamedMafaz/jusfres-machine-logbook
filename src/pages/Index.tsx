import React from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import LoginForm from '@/components/LoginForm';
import Dashboard from '@/components/Dashboard';
import NotificationToast from '@/components/NotificationToast';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <NotificationToast />
      {user ? <Dashboard /> : <LoginForm />}
    </>
  );
};

const Index: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default Index;
