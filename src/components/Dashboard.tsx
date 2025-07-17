import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MaintenanceEntry } from '@/types/maintenance';
import { 
  Plus, 
  ClipboardList, 
  LogOut, 
  User, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Calendar
} from 'lucide-react';
import Step1 from './MaintenanceForm/Step1';
import Step2 from './MaintenanceForm/Step2';
import Step3 from './MaintenanceForm/Step3';
import EntriesPage from './EntriesPage';
import CompletionScreen from './CompletionScreen';

type View = 'dashboard' | 'form' | 'entries' | 'completion';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [formData, setFormData] = useState<Partial<MaintenanceEntry>>({
    filled_by: user?.displayName || '',
    date_of_entry: new Date().toISOString().split('T')[0],
    current_step: 1,
  });
  const [currentEntry, setCurrentEntry] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [recentEntries, setRecentEntries] = useState<MaintenanceEntry[]>([]);

  // Load recent entries for dashboard
  useEffect(() => {
    if (currentView === 'dashboard') {
      loadRecentEntries();
    }
  }, [currentView]);

  const loadRecentEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_entries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentEntries(data || []);
    } catch (error) {
      console.error('Error loading recent entries:', error);
    }
  };

  const startNewEntry = () => {
    setFormData({
      filled_by: user?.displayName || '',
      date_of_entry: new Date().toISOString().split('T')[0],
      current_step: 1,
    });
    setCurrentEntry(null);
    setCurrentView('form');
  };

  const updateFormData = (updates: Partial<MaintenanceEntry>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const sendNotification = async (step: number, entryId: string) => {
    try {
      await supabase.functions.invoke('send-notification', {
        body: {
          user: user?.displayName,
          step,
          entryId
        }
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const submitStep = async (step: number) => {
    setIsLoading(true);
    try {
      const updates: Partial<MaintenanceEntry> = {
        current_step: step + 1,
        [`step${step}_completed`]: true,
        [`step${step}_completed_at`]: new Date().toISOString(),
      };

      if (currentEntry) {
        // Update existing entry
        const { error } = await supabase
          .from('maintenance_entries')
          .update({ ...formData, ...updates })
          .eq('id', currentEntry);

        if (error) throw error;
      } else {
        // Create new entry
        const { data, error } = await supabase
          .from('maintenance_entries')
          .insert([{ 
            ...formData, 
            ...updates,
            filled_by: formData.filled_by || user?.displayName || ''
          }])
          .select()
          .single();

        if (error) throw error;
        setCurrentEntry(data.id);
      }

      // Send notification
      await sendNotification(step, currentEntry || 'new');

      // Update local form data
      updateFormData(updates);

      if (step === 3) {
        setCurrentView('completion');
      }

      toast({
        title: "Step Completed",
        description: `Step ${step} has been saved successfully.`,
      });

    } catch (error) {
      console.error('Error submitting step:', error);
      toast({
        title: "Error",
        description: "Failed to save step. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderCurrentStep = () => {
    const step = formData.current_step || 1;
    
    switch (step) {
      case 1:
        return (
          <Step1 
            formData={formData}
            onUpdate={updateFormData}
            onSubmit={() => submitStep(1)}
            isLoading={isLoading}
          />
        );
      case 2:
        return (
          <Step2 
            formData={formData}
            onUpdate={updateFormData}
            onSubmit={() => submitStep(2)}
            isLoading={isLoading}
          />
        );
      case 3:
        return (
          <Step3 
            formData={formData}
            onUpdate={updateFormData}
            onSubmit={() => submitStep(3)}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  if (currentView === 'form') {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <Button 
              variant="outline" 
              onClick={() => setCurrentView('dashboard')}
            >
              ← Back to Dashboard
            </Button>
            <h2 className="font-semibold">Maintenance Form</h2>
            <Button variant="ghost" onClick={logout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
          {renderCurrentStep()}
        </div>
      </div>
    );
  }

  if (currentView === 'entries') {
    return <EntriesPage onBack={() => setCurrentView('dashboard')} />;
  }

  if (currentView === 'completion') {
    return (
      <CompletionScreen 
        onNewEntry={startNewEntry}
        onViewEntries={() => setCurrentView('entries')}
        onDashboard={() => setCurrentView('dashboard')}
      />
    );
  }

  // Dashboard view
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-maintenance rounded-xl flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">JusFres Maintenance</h1>
              <p className="text-muted-foreground">Machine Logbook System</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{user?.displayName}</span>
            </div>
            <Button variant="ghost" onClick={logout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:shadow-maintenance transition-shadow" onClick={startNewEntry}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">New Maintenance Entry</h3>
                  <p className="text-muted-foreground">Start a new maintenance logbook entry</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-maintenance transition-shadow" onClick={() => setCurrentView('entries')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-maintenance-secondary rounded-xl flex items-center justify-center">
                  <ClipboardList className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">View All Entries</h3>
                  <p className="text-muted-foreground">Browse and search maintenance records</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Entries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Recent Entries
            </CardTitle>
            <CardDescription>Latest maintenance entries from the team</CardDescription>
          </CardHeader>
          <CardContent>
            {recentEntries.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No maintenance entries found. Start by creating a new entry.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {recentEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-maintenance-primary rounded-full"></div>
                      <div>
                        <p className="font-medium">{entry.filled_by}</p>
                        <p className="text-sm text-muted-foreground">
                          {entry.start_location} → {entry.end_location || 'In Progress'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={
                        entry.step3_completed ? "default" : 
                        entry.step2_completed ? "secondary" : "outline"
                      }>
                        {entry.step3_completed ? (
                          <><CheckCircle className="w-3 h-3 mr-1" /> Complete</>
                        ) : (
                          <><Clock className="w-3 h-3 mr-1" /> Step {entry.current_step}/3</>
                        )}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.date_of_entry).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Dashboard;