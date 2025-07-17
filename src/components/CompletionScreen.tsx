import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Plus, ClipboardList, Home } from 'lucide-react';

interface CompletionScreenProps {
  onNewEntry: () => void;
  onViewEntries: () => void;
  onDashboard: () => void;
}

const CompletionScreen: React.FC<CompletionScreenProps> = ({ 
  onNewEntry, 
  onViewEntries, 
  onDashboard 
}) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        
        {/* Success Icon */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-maintenance-secondary rounded-full flex items-center justify-center shadow-maintenance">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Entry Complete!</h1>
            <p className="text-muted-foreground mt-2">
              Your maintenance entry has been successfully submitted and all team members have been notified.
            </p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="space-y-3">
          
          <Card className="cursor-pointer hover:shadow-maintenance transition-shadow" onClick={onNewEntry}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Start New Entry</h3>
                  <p className="text-sm text-muted-foreground">Begin another maintenance entry</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-maintenance transition-shadow" onClick={onViewEntries}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-maintenance-secondary rounded-lg flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">View All Entries</h3>
                  <p className="text-sm text-muted-foreground">Browse maintenance history</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-maintenance transition-shadow" onClick={onDashboard}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-maintenance-accent rounded-lg flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Back to Dashboard</h3>
                  <p className="text-sm text-muted-foreground">Return to the main dashboard</p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>JusFres Maintenance Team • Entry Successfully Recorded</p>
        </div>

      </div>
    </div>
  );
};

export default CompletionScreen;