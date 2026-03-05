import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { MaintenanceEntry } from '@/types/maintenance';
import { formatVancouverDateTime } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MaintenanceDetailsDialog from './MaintenanceDetailsDialog';
import { format, subDays } from 'date-fns';
import {
  Search,
  MapPin,
  User,
  AlertCircle,
  X,
  Filter,
  ArrowUpDown,
  ArrowLeft,
  Calendar,
  Download
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';

interface IssueMonitoringProps {
  onBack: () => void;
}

const IssueMonitoring: React.FC<IssueMonitoringProps> = ({ onBack }) => {
  const isMobile = useIsMobile();
  const [entries, setEntries] = useState<MaintenanceEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<MaintenanceEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Filters
  const [userFilter, setUserFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('maintenance_entries')
        .select('*')
        .or('issues_errors.neq."",apple_issues_errors.neq.""')
        .order('created_at', { ascending: false });

      // Clean up nulls implicitly in javascript
      const validEntries = ((data || []) as unknown as MaintenanceEntry[]).filter(e => e.issues_errors || e.apple_issues_errors);
      setEntries(validEntries);
    } catch (error) {
      console.error('Error loading issues:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const uniqueUsers = useMemo(() => {
    return Array.from(new Set(entries.map(e => e.filled_by))).filter(Boolean).sort();
  }, [entries]);

  const uniqueLocations = useMemo(() => {
    const locs = entries.flatMap(e => [e.start_location, e.end_location]);
    return Array.from(new Set(locs)).filter(Boolean).sort();
  }, [entries]);

  const filteredEntries = useMemo(() => {
    let result = entries.filter(entry => {
      const combinedIssues = [entry.issues_errors, entry.apple_issues_errors].filter(Boolean).join(' | ');
      const matchesSearch = !searchTerm || [
        entry.filled_by,
        entry.start_location,
        entry.end_location,
        combinedIssues
      ].some(val => val?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesUser = userFilter === 'all' || entry.filled_by === userFilter;
      const matchesLocation = locationFilter === 'all' || 
        entry.start_location === locationFilter || 
        entry.end_location === locationFilter;

      const matchesDate = (!startDate || entry.date_of_entry >= startDate) && 
                          (!endDate || entry.date_of_entry <= endDate);

      return matchesSearch && matchesUser && matchesLocation && matchesDate;
    });

    return result.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [entries, searchTerm, userFilter, locationFilter, sortOrder, startDate, endDate]);

  const exportToCSV = () => {
    if (filteredEntries.length === 0) return;

    const headers = ['Date', 'User', 'Location', 'Issue Description', 'Status'];
    const csvRows = [headers.join(',')];

    filteredEntries.forEach(entry => {
      const row = [
        `"${new Date(entry.date_of_entry).toLocaleDateString()}"`,
        `"${entry.filled_by}"`,
        `"${entry.start_location}"`,
        `"${[
          entry.issues_errors ? `Orange: ${entry.issues_errors}` : '',
          entry.apple_issues_errors ? `Apple: ${entry.apple_issues_errors}` : ''
        ].filter(Boolean).join(' | ').replace(/"/g, '""')}"`,
        `"${entry.step3_completed ? 'Resolved' : 'Pending'}"`
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.body.appendChild(document.createElement('a'));
    link.href = URL.createObjectURL(blob);
    link.download = `maintenance_issues_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Issue Monitoring</h1>
            <p className="text-muted-foreground">Track and manage machine issues</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportToCSV} disabled={filteredEntries.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Badge variant="destructive" className="px-3 py-1">
            {entries.length} Issues Reported
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative md:col-span-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search issues..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <SelectValue placeholder="All Users" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {uniqueUsers.map(user => (
              <SelectItem key={user} value={user || ''}>{user}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <SelectValue placeholder="All Locations" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {uniqueLocations.map(loc => (
              <SelectItem key={loc} value={loc || ''}>{loc}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortOrder} onValueChange={(v: any) => setSortOrder(v)}>
          <SelectTrigger>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4" />
              <SelectValue placeholder="Sort Order" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
          </SelectContent>
        </Select>

        <div className="md:col-span-1 flex items-center gap-2">
          <div className="flex-1">
            <Label htmlFor="start-date" className="text-[10px] uppercase text-muted-foreground ml-1">Start Date</Label>
            <Input
              id="start-date"
              type="date"
              className="h-9"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <Label htmlFor="end-date" className="text-[10px] uppercase text-muted-foreground ml-1">End Date</Label>
            <Input
              id="end-date"
              type="date"
              className="h-9"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          {(startDate || endDate) && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="mt-4" 
              onClick={() => { setStartDate(''); setEndDate(''); }}
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading issues...</div>
          ) : filteredEntries.length === 0 ? (
            <Alert className="m-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>No issues found matching your filters.</AlertDescription>
            </Alert>
          ) : isMobile ? (
            <div className="p-4 space-y-4">
              {filteredEntries.map(entry => (
                <Card key={entry.id} className="cursor-pointer hover:bg-accent/50" onClick={() => {
                  setSelectedEntry(entry);
                  setShowDetails(true);
                }}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="font-semibold text-primary">{entry.filled_by}</div>
                      <Badge variant="outline" className="text-xs">
                        {new Date(entry.date_of_entry).toLocaleDateString()}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-2">
                      {entry.issues_errors && (
                        <div className="text-sm text-foreground bg-red-50 dark:bg-red-900/10 p-2 rounded border border-red-100 dark:border-red-900/20 font-medium">
                          <span className="font-bold text-xs uppercase mr-2 text-red-800">Orange:</span>
                          {entry.issues_errors}
                        </div>
                      )}
                      {entry.apple_issues_errors && (
                        <div className="text-sm text-foreground bg-red-50 dark:bg-red-900/10 p-2 rounded border border-red-100 dark:border-red-900/20 font-medium">
                          <span className="font-bold text-xs uppercase mr-2 text-red-800">Apple:</span>
                          {entry.apple_issues_errors}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {entry.start_location}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="w-[40%]">Issue Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.map((entry) => (
                  <TableRow key={entry.id} className="cursor-pointer hover:bg-muted/50" onClick={() => {
                    setSelectedEntry(entry);
                    setShowDetails(true);
                  }}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {new Date(entry.date_of_entry).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        {entry.filled_by}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate max-w-[150px]">{entry.start_location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2">
                        {entry.issues_errors && (
                          <div className="bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 p-2 rounded border border-red-100 dark:border-red-900/20 text-sm font-medium">
                            <span className="font-bold text-xs uppercase mr-2 text-red-800">Orange:</span>
                            {entry.issues_errors}
                          </div>
                        )}
                        {entry.apple_issues_errors && (
                          <div className="bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 p-2 rounded border border-red-100 dark:border-red-900/20 text-sm font-medium">
                            <span className="font-bold text-xs uppercase mr-2 text-red-800">Apple:</span>
                            {entry.apple_issues_errors}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">View Details</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <MaintenanceDetailsDialog
        open={showDetails}
        onOpenChange={setShowDetails}
        entry={selectedEntry}
      />
    </div>
  );
};

export default IssueMonitoring;
