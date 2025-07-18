import React from 'react';
import Dashboard from '@/components/Dashboard';

const Index: React.FC = () => {
  return (
    <div className="min-h-screen w-full px-2 sm:px-4 py-2 sm:py-4">
      <div className="max-w-4xl mx-auto">
        <Dashboard />
      </div>
    </div>
  );
};

export default Index;
