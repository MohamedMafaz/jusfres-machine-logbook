import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { MaintenanceEntry } from '@/types/maintenance';
import { 
  ArrowLeft, 
  Search, 
  Calendar, 
  MapPin, 
  User, 
  CheckCircle, 
  Clock,
  AlertCircle 
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EntriesPageProps {
  onBack: () => void;
}

const EntriesPage: React.FC<EntriesPageProps> = ({ onBack }) => {
  const [entries, setEntries] = useState<MaintenanceEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<MaintenanceEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadEntries();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('maintenance_entries_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'maintenance_entries'
        },
        () => {
          console.log('Maintenance entries updated, reloading...');
          loadEntries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    // Filter entries based on search term
    const filtered = entries.filter(entry => 
      entry.filled_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.start_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.end_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.tasks_completed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.issues_errors?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredEntries(filtered);
  }, [entries, searchTerm]);

  const loadEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (entry: MaintenanceEntry) => {
    if (entry.step3_completed) {
      return <Badge className="bg-maintenance-secondary text-white"><CheckCircle className="w-3 h-3 mr-1" /> Complete</Badge>;
    } else if (entry.step2_completed) {
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Step 3 Pending</Badge>;
    } else if (entry.step1_completed) {
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Step 2 Pending</Badge>;
    } else {
      return <Badge variant="outline"><Clock className="w-3 h-3 mr-1" /> Step 1 Pending</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Maintenance Entries</h1>
              <p className="text-muted-foreground">All maintenance records from the team</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search entries by user, location, tasks, or issues..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Entries Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              All Entries ({filteredEntries.length})
            </CardTitle>
            <CardDescription>
              Complete maintenance history and current progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading entries...</p>
              </div>
            ) : filteredEntries.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {searchTerm ? 'No entries match your search criteria.' : 'No maintenance entries found.'}
                </AlertDescription>
              </Alert>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Start Location</TableHead>
                      <TableHead>End Location</TableHead>
                      <TableHead>Tasks</TableHead>
                      <TableHead>Issues</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{entry.filled_by}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(entry.date_of_entry || '').toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>{entry.start_location || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>{entry.end_location || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="text-sm text-muted-foreground truncate">
                              {entry.tasks_completed || '-'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="text-sm text-muted-foreground truncate">
                              {entry.issues_errors || '-'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(entry)}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {new Date(entry.created_at || '').toLocaleDateString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default EntriesPage;