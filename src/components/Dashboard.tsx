import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { MaintenanceEntry } from '@/types/maintenance';
import { getHomeBaseForUser } from '@/constants/locations';
import {
  Plus,
  ClipboardList,
  LogOut,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  BarChart3,
  PlayCircle
} from 'lucide-react';
import Step1 from './MaintenanceForm/Step1';
import Step2 from './MaintenanceForm/Step2';
import EntriesPage from './EntriesPage';
import CompletionScreen from './CompletionScreen';
import NotificationToast from './NotificationToast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

type View = 'dashboard' | 'form' | 'entries' | 'completion';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
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
  const [selectedEntry, setSelectedEntry] = useState<MaintenanceEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      setRecentEntries(
        (data || []).map(entry => ({
          ...entry,
          filled_cleaning_water: entry.filled_cleaning_water === true || (entry.filled_cleaning_water as any) === 'true',
          filled_refrigerant_water: entry.filled_refrigerant_water === true || (entry.filled_refrigerant_water as any) === 'true',
        }))
      );
    } catch (error) {
      console.error('Error loading recent entries:', error);
    }
  };

  const startNewEntry = async () => {
    setIsLoading(true);
    try {
      // Fetch the most recent entry for the current user
      const { data: lastEntry } = await supabase
        .from('maintenance_entries')
        .select('*')
        .eq('filled_by', user?.displayName)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const newFormData: Partial<MaintenanceEntry> = {
        filled_by: user?.displayName || '',
        date_of_entry: new Date().toISOString().split('T')[0],
        start_time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        start_location: getHomeBaseForUser(user?.displayName || ''),
        current_step: 1,
      };

      if (lastEntry) {
        // Carry over values from the previous entry
        if (lastEntry.end_location) {
          newFormData.start_location = lastEntry.end_location;
        }
        newFormData.items_carried = lastEntry.items_carried ?? undefined;
        newFormData.orange_88_count = lastEntry.boxes_88 ?? undefined;
        newFormData.orange_113_count = lastEntry.boxes_113 ?? undefined;
        newFormData.orange_custom_box_count = lastEntry.boxes_custom ?? undefined;
        // newFormData.orange_custom_count_per_box = lastEntry.orange_custom_count_per_box;

        // Auto-fill Step 1 specific fields from previous entry's end values
        newFormData.odometer_start = lastEntry.odometer_end ?? undefined;
        newFormData.battery_start = lastEntry.battery_end ?? undefined;
      }

      setFormData(newFormData);
      setCurrentEntry(null);
      setCurrentView('form');
    } catch (error) {
      console.error('Error starting new entry:', error);
      toast({
        title: "Error",
        description: "Failed to load previous entry data. Starting with a blank form.",
        variant: "destructive",
      });
      // Fallback to empty form
      setFormData({
        filled_by: user?.displayName || '',
        date_of_entry: new Date().toISOString().split('T')[0],
        current_step: 1,
      });
      setCurrentEntry(null);
      setCurrentView('form');
    } finally {
      setIsLoading(false);
    }
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

  const calculateDuration = (start: string | undefined, end: string | undefined): number => {
    if (!start || !end) return 0;

    const [startHours, startMinutes] = start.split(':').map(Number);
    const [endHours, endMinutes] = end.split(':').map(Number);

    const startDate = new Date(0, 0, 0, startHours, startMinutes);
    const endDate = new Date(0, 0, 0, endHours, endMinutes);

    let diff = (endDate.getTime() - startDate.getTime()) / 1000 / 60; // minutes

    // Handle overnight case (if end time is before start time, assume next day)
    if (diff < 0) {
      diff += 24 * 60;
    }

    return Math.round(diff);
  };

  const submitStep = async (step: number) => {
    setIsLoading(true);
    try {
      const updates: Partial<MaintenanceEntry> = {
        current_step: step + 1,
        [`step${step}_completed`]: true,
        [`step${step}_completed_at`]: new Date().toISOString(),
      };

      // If step 2 is completed, we are done (since we merged step 2 and 3)
      // So we must also mark step 3 as completed to satisfy the "Trip Completed" logic
      if (step === 2) {
        updates.step3_completed = true;
        updates.step3_completed_at = new Date().toISOString();

        // Calculate distance and duration
        if (formData.odometer_start && formData.odometer_end) {
          updates.distance = formData.odometer_end - formData.odometer_start;
        }

        if (formData.start_time && formData.end_time) {
          updates.duration_minutes = calculateDuration(formData.start_time, formData.end_time);
        }
      }

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

      // If step 2 is completed, we are done
      if (step === 2) {
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
      <NotificationToast />
      <div className="container mx-auto p-4 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-maintenance rounded-xl flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">JusFres Maintenance Application</h1>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            className="cursor-pointer hover:shadow-maintenance transition-shadow"
            onClick={startNewEntry}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    New Maintenance Entry
                  </h3>
                  <p className="text-muted-foreground">
                    Start a new maintenance logbook entry
                  </p>
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

          <Card className="cursor-pointer hover:shadow-maintenance transition-shadow" onClick={() => navigate('/analytics')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Analytics</h3>
                  <p className="text-muted-foreground">View reports, charts and predictions</p>
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
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-accent"
                    onClick={() => {
                      setSelectedEntry(entry);
                      setIsModalOpen(true);
                    }}
                  >
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
        {/* Entry Details Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Entry Details</DialogTitle>
              <DialogDescription>
                {selectedEntry && (
                  <div className="space-y-2">
                    <div><strong>Filled By:</strong> {selectedEntry.filled_by}</div>
                    <div><strong>Date:</strong> {selectedEntry.date_of_entry}</div>
                    <div><strong>Start Location:</strong> {selectedEntry.start_location}</div>
                    <div><strong>End Location:</strong> {selectedEntry.end_location}</div>
                    <div><strong>Tasks Completed:</strong> {Array.isArray(selectedEntry.tasks_completed) ? selectedEntry.tasks_completed.join(', ') : selectedEntry.tasks_completed}</div>
                    <div><strong>Issues/Errors:</strong> {selectedEntry.issues_errors}</div>
                    {/* Add more fields as needed */}
                  </div>
                )}
              </DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Dashboard;