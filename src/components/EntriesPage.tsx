import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { MaintenanceEntry } from '@/types/maintenance';
import { getHomeBaseForUser } from '@/constants/locations';
import { formatVancouverDateTime } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MaintenanceDetailsDialog from './MaintenanceDetailsDialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { DateRange } from 'react-day-picker';
import {
  ArrowLeft,
  Search,
  Calendar,
  MapPin,
  User,
  CheckCircle,
  Clock,
  AlertCircle,
  X,
  Thermometer,
  Battery,
  Package,
  Droplets,
  Wrench,
  AlertTriangle,
  Download,
  Route,
  ChevronDown,
  ChevronUp,
  Filter,
  ArrowUpDown,
  ListFilter,
  Settings2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';

interface EntriesPageProps {
  onBack: () => void;
}

interface Trip {
  id: string;
  user: string;
  date: string;
  entries: MaintenanceEntry[];
  totalDuration: number;
  totalDistance: number;
  totalBatteryConsumed: number;
  startTime: string;
  endTime: string;
  status: 'Complete' | 'In Progress';
}

const EntriesPage: React.FC<EntriesPageProps> = ({ onBack }) => {
  const isMobile = useIsMobile();
  const [entries, setEntries] = useState<MaintenanceEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<MaintenanceEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<MaintenanceEntry | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [expandedTrip, setExpandedTrip] = useState<string | null>(null);

  // Advanced Filtering & Sorting State
  const [userFilter, setUserFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tasksFilter, setTasksFilter] = useState<string[]>([]);
  const [issuesFilter, setIssuesFilter] = useState<string[]>([]);
  const [itemsCarriedFilter, setItemsCarriedFilter] = useState<string[]>([]);
  const [waterCleaningStatusFilter, setWaterCleaningStatusFilter] = useState<string>('all');
  const [refrigerantWaterStatusFilter, setRefrigerantWaterStatusFilter] = useState<string>('all');
  const [filledCleaningWaterFilter, setFilledCleaningWaterFilter] = useState<string>('all');
  const [filledRefrigerantWaterFilter, setFilledRefrigerantWaterFilter] = useState<string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [sortConfig, setSortConfig] = useState<{ key: keyof MaintenanceEntry | 'status'; direction: 'asc' | 'desc' }>({
    key: 'date_of_entry',
    direction: 'desc',
  });

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

  // Extract unique values for filters
  const uniqueUsers = useMemo(() => {
    return Array.from(new Set(entries.map(e => e.filled_by))).filter(Boolean).sort();
  }, [entries]);

  const uniqueLocations = useMemo(() => {
    const locs = entries.flatMap(e => [e.start_location, e.end_location]);
    return Array.from(new Set(locs)).filter(Boolean).sort();
  }, [entries]);

  const processedData = useMemo(() => {
    // 1. Filter
    let result = entries.filter(entry => {
      // Search term
      const matchesSearch = !searchTerm || [
        entry.filled_by,
        entry.start_location,
        entry.end_location,
        entry.tasks_completed,
        entry.apple_tasks_completed,
        entry.issues_errors,
        entry.apple_issues_errors
      ].some(val => val?.toString().toLowerCase().includes(searchTerm.toLowerCase()));

      // User filter
      const matchesUser = userFilter === 'all' || entry.filled_by === userFilter;

      // Location filter
      const matchesLocation = locationFilter === 'all' ||
        entry.start_location === locationFilter ||
        entry.end_location === locationFilter;

      // Status filter
      const matchesStatus = statusFilter === 'all' || (() => {
        if (statusFilter === 'Complete') return entry.step3_completed;
        if (statusFilter === 'Step 3 Pending') return entry.step2_completed && !entry.step3_completed;
        if (statusFilter === 'Step 2 Pending') return entry.step1_completed && !entry.step2_completed;
        if (statusFilter === 'Step 1 Pending') return !entry.step1_completed;
        return true;
      })();

      // Tasks Filter
      const combinedTasks = [entry.tasks_completed, entry.apple_tasks_completed].filter(Boolean).join(' | ');
      const matchesTasks = tasksFilter.length === 0 || tasksFilter.some(task => 
        combinedTasks.toLowerCase().includes(task.toLowerCase())
      );

      // Issues Filter
      const combinedIssues = [entry.issues_errors, entry.apple_issues_errors].filter(Boolean).join(' | ');
      const matchesIssues = issuesFilter.length === 0 || issuesFilter.some(issue => 
        combinedIssues.toLowerCase().includes(issue.toLowerCase())
      );

      // Items Carried Filter
      const matchesItemsCarried = itemsCarriedFilter.length === 0 || itemsCarriedFilter.some(item => 
        entry.items_carried?.toString().toLowerCase().includes(item.toLowerCase())
      );

      // Water Status Filters
      const matchesWaterCleaning = waterCleaningStatusFilter === 'all' || entry.water_cleaning_status === waterCleaningStatusFilter;
      const matchesRefrigerantWater = refrigerantWaterStatusFilter === 'all' || entry.refrigerant_water_status === refrigerantWaterStatusFilter;

      // Water Filling Filters
      const matchesFilledCleaning = filledCleaningWaterFilter === 'all' || (() => {
        const val = entry.filled_cleaning_water;
        const isTrue = val === true;
        return filledCleaningWaterFilter === 'Yes' ? isTrue : !isTrue;
      })();

      const matchesFilledRefrigerant = filledRefrigerantWaterFilter === 'all' || (() => {
        const val = entry.filled_refrigerant_water;
        const isTrue = val === true;
        return filledRefrigerantWaterFilter === 'Yes' ? isTrue : !isTrue;
      })();

      // Date range filter
      const matchesDate = !dateRange?.from || (() => {
        if (!entry.date_of_entry) return false;
        const entryDate = new Date(entry.date_of_entry);
        const start = startOfDay(dateRange.from!);
        const end = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from!);
        return isWithinInterval(entryDate, { start, end });
      })();

      return matchesSearch && matchesUser && matchesLocation && matchesStatus && matchesDate && 
             matchesTasks && matchesIssues && matchesItemsCarried && 
             matchesWaterCleaning && matchesRefrigerantWater && 
             matchesFilledCleaning && matchesFilledRefrigerant;
    });

    // 2. Sort
    result.sort((a, b) => {
      let valA: any = a[sortConfig.key as keyof MaintenanceEntry];
      let valB: any = b[sortConfig.key as keyof MaintenanceEntry];

      // Handle status sort manually
      if (sortConfig.key === 'status') {
        const getStatusRank = (e: MaintenanceEntry) => {
          if (e.step3_completed) return 4;
          if (e.step2_completed) return 3;
          if (e.step1_completed) return 2;
          return 1;
        };
        valA = getStatusRank(a);
        valB = getStatusRank(b);
      }

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [entries, searchTerm, userFilter, locationFilter, statusFilter, dateRange, sortConfig]);

  useEffect(() => {
    setFilteredEntries(processedData);

    // Update trips based on processed entries
    const processedTrips = groupEntriesIntoTrips(processedData);
    setTrips(processedTrips);
  }, [processedData]);

  const requestSort = (key: keyof MaintenanceEntry | 'status') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const loadEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('maintenance_entries')
        .select('*')
        .order('created_at', { ascending: false }); // Newest first

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const groupEntriesIntoTrips = (allEntries: MaintenanceEntry[]): Trip[] => {
    // Sort by date ascending to build trips chronologically
    const sorted = [...allEntries].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    const trips: Trip[] = [];
    let currentTripEntries: MaintenanceEntry[] = [];

    sorted.forEach(entry => {
      // Get the user's home base for this entry
      const userHomeBase = getHomeBaseForUser(entry.filled_by);

      // Start of a new trip logic:
      // If start_location matches user's home base, it's definitely a start.
      // Or if we don't have a current trip, we start one (handling incomplete data).

      if (entry.start_location === userHomeBase) {
        // If we were already building a trip, close it (it was incomplete or previous logic failed)
        if (currentTripEntries.length > 0) {
          trips.push(createTripObject(currentTripEntries));
        }
        currentTripEntries = [entry];
      } else {
        // Continue existing trip
        if (currentTripEntries.length === 0) {
          // Orphaned entry (didn't start at home base), treat as its own trip or start of one
          currentTripEntries = [entry];
        } else {
          currentTripEntries.push(entry);
        }
      }

      // End of a trip logic:
      // If end_location matches user's home base, the trip ends here.
      if (entry.end_location === userHomeBase) {
        trips.push(createTripObject(currentTripEntries));
        currentTripEntries = [];
      }
    });

    // Add any remaining incomplete trip
    if (currentTripEntries.length > 0) {
      trips.push(createTripObject(currentTripEntries));
    }

    // Return reversed (newest trips first)
    return trips.reverse();
  };

  const createTripObject = (tripEntries: MaintenanceEntry[]): Trip => {
    const first = tripEntries[0];
    const last = tripEntries[tripEntries.length - 1];

    const totalDuration = tripEntries.reduce((sum, e) => sum + (e.duration_minutes || 0), 0);
    const totalDistance = tripEntries.reduce((sum, e) => sum + (e.distance || 0), 0);

    // Battery consumed: Sum of (Start - End) for each leg
    const totalBatteryConsumed = tripEntries.reduce((sum, e) => {
      const start = e.battery_start || 0;
      const end = e.battery_end || 0;
      return sum + (start - end);
    }, 0);

    // Get the user's home base for trip completion check
    const userHomeBase = getHomeBaseForUser(first.filled_by);
    const isComplete = last.end_location === userHomeBase;

    return {
      id: first.id, // Use first entry ID as trip ID
      user: first.filled_by,
      date: first.date_of_entry,
      entries: tripEntries,
      totalDuration,
      totalDistance: Math.round(totalDistance * 100) / 100,
      totalBatteryConsumed,
      startTime: first.start_time || '',
      endTime: last.end_time || '',
      status: isComplete ? 'Complete' : 'In Progress'
    };
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

  const exportToCSV = () => {
    if (filteredEntries.length === 0) {
      toast({
        title: "No Data",
        description: "No entries to export.",
        variant: "destructive",
      });
      return;
    }

    // Define CSV headers
    const headers = [
      'User',
      'Date',
      'Start Location',
      'End Location',
      'Distance (km)',
      'Start Time',
      'End Time',
      'Duration (minutes)',
      'Machine Time (minutes)',
      'Temperature (°C)',
      'Battery Start (%)',
      'Battery End (%)',
      'Odometer Start (km)',
      'Odometer End (km)',
      'Oranges Placed',
      'Apples Placed',
      'Orange (88)',
      'Orange (113)',
      'Orange Custom Boxes',
      'Orange Custom Count/Box',
      'Apple (88)',
      'Apple (113)',
      'Apple Custom Boxes',
      'Apple Custom Count/Box',
      'Apple Refill',
      'Orange Refill',
      'Orange Refill Type',
      'Orange Refill Tasks',
      'Cup Availability',
      'Lid Availability',
      'Lid Availability Type',
      'Cleaning Water Status',
      'Refrigerant Water Status',
      'Filled Cleaning Water',
      'Filled Refrigerant Water',
      'Items Carried',
      'Tasks Completed (Orange)',
      'Issues/Errors (Orange)',
      'Tasks Completed (Apple)',
      'Issues/Errors (Apple)',
      'Temperature (Apple)',
      'Cup Availability (Apple)',
      'Lid Availability (Apple)',
      'Cleaning Water Status (Apple)',
      'Refrigerant Water Status (Apple)',
      'Filled Cleaning Water (Apple)',
      'Filled Refrigerant Water (Apple)',
      'Status',
      'Created At',
      'Updated At',
      'Step 1 Completed At',
      'Step 2 Completed At',
      'Step 3 Completed At'
    ];

    // Convert entries to CSV rows
    const csvRows = [headers.join(',')];

    filteredEntries.forEach(entry => {
      const status = entry.step3_completed ? 'Complete' :
        entry.step2_completed ? 'Step 3 Pending' :
          entry.step1_completed ? 'Step 2 Pending' : 'Step 1 Pending';

      const row = [
        `"${entry.filled_by || ''}"`,
        `"${entry.date_of_entry || ''}"`,
        `"${entry.start_location || ''}"`,
        `"${entry.end_location || ''}"`,
        entry.distance || '',
        `"${entry.start_time || ''}"`,
        `"${entry.end_time || ''}"`,
        entry.duration_minutes || '',
        entry.time_spent_machine || '',
        entry.temperature || '',
        entry.battery_start || '',
        entry.battery_end || '',
        entry.odometer_start || '',
        entry.odometer_end || '',
        entry.oranges_placed || '',
        entry.apples_placed || '',
        entry.orange_88_count || '',
        entry.orange_113_count || '',
        entry.orange_custom_box_count || '',
        entry.orange_custom_count_per_box || '',
        entry.apple_88_count || '',
        entry.apple_113_count || '',
        entry.apple_custom_box_count || '',
        entry.apple_custom_count_per_box || '',
        entry.apple_refill || '',
        entry.orange_refill || '',
        `"${entry.orange_refill_type || ''}"`,
        `"${Array.isArray(entry.orange_refill_tasks) ? entry.orange_refill_tasks.join(', ') : ''}"`,
        entry.cup_availability || '',
        entry.lid_availability || '',
        `"${entry.lid_availability_type || ''}"`,
        `"${entry.water_cleaning_status || ''}"`,
        `"${entry.refrigerant_water_status || ''}"`,
        entry.filled_cleaning_water ? 'Yes' : 'No',
        entry.filled_refrigerant_water ? 'Yes' : 'No',
        `"${Array.isArray(entry.items_carried)
          ? entry.items_carried.join(', ')
          : (typeof entry.items_carried === 'string' && entry.items_carried.includes(',')
            ? entry.items_carried.split(',').map(i => i.trim()).filter(Boolean).join(', ')
            : (entry.items_carried || ''))}"`,
        `"${entry.tasks_completed || ''}"`,
        `"${entry.issues_errors || ''}"`,
        `"${entry.apple_tasks_completed || ''}"`,
        `"${entry.apple_issues_errors || ''}"`,
        entry.apple_temperature || '',
        entry.apple_cup_availability || '',
        entry.apple_lid_availability || '',
        `"${entry.apple_water_cleaning_status || ''}"`,
        `"${entry.apple_refrigerant_water_status || ''}"`,
        entry.apple_filled_cleaning_water ? 'Yes' : 'No',
        entry.apple_filled_refrigerant_water ? 'Yes' : 'No',
        `"${status}"`,
        `"${formatVancouverDateTime(entry.created_at)}"`,
        `"${formatVancouverDateTime(entry.updated_at)}"`,
        `"${formatVancouverDateTime(entry.step1_completed_at)}"`,
        `"${formatVancouverDateTime(entry.step2_completed_at)}"`,
        `"${formatVancouverDateTime(entry.step3_completed_at)}"`
      ];

      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `maintenance_entries_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast({
      title: "Export Successful",
      description: `${filteredEntries.length} entries exported to CSV.`,
    });
  };

  const handleEntryClick = (entry: MaintenanceEntry) => {
    setSelectedEntry(entry);
    setShowDetails(true);
  };

  const currentEntryIndex = useMemo(() => {
    if (!selectedEntry) return -1;
    return filteredEntries.findIndex(e => e.id === selectedEntry.id);
  }, [selectedEntry, filteredEntries]);

  const handlePreviousEntry = () => {
    if (currentEntryIndex > 0) {
      setSelectedEntry(filteredEntries[currentEntryIndex - 1]);
    }
  };

  const handleNextEntry = () => {
    if (currentEntryIndex < filteredEntries.length - 1) {
      setSelectedEntry(filteredEntries[currentEntryIndex + 1]);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showDetails) return;
      if (e.key === 'ArrowLeft') handlePreviousEntry();
      if (e.key === 'ArrowRight') handleNextEntry();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDetails, currentEntryIndex, filteredEntries]);

  const renderMobileCard = (entry: MaintenanceEntry) => (
    <Card
      key={entry.id}
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => handleEntryClick(entry)}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{entry.filled_by}</span>
            </div>
            {getStatusBadge(entry)}
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            {formatVancouverDateTime(entry.date_of_entry, false)}
          </div>

          {/* Locations */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">From:</span>
              <span>{entry.start_location || '-'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">To:</span>
              <span>{entry.end_location || '-'}</span>
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
            {entry.temperature && (
              <div className="flex items-center gap-1">
                <Thermometer className="w-3 h-3" />
                <span>{entry.temperature}°C</span>
              </div>
            )}
            {entry.distance && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span>{entry.distance}km</span>
              </div>
            )}
          </div>

          {/* Work Performed */}
          <div className="flex flex-wrap gap-1 pt-1">
            {entry.tasks_completed?.split(',').slice(0, 3).map((task, i) => (
              <Badge key={i} variant="outline" className="text-[10px] py-0 px-1 bg-blue-50/50 text-blue-700 border-blue-200">
                {task.trim()}
              </Badge>
            ))}
            {entry.issues_errors && (
              <Badge variant="outline" className="text-[10px] py-0 px-1 bg-red-50/50 text-red-700 border-red-200">
                Issues reported
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Maintenance Entries</h1>
              <p className="text-muted-foreground">All maintenance records from the team</p>
            </div>
          </div>
          <Button onClick={exportToCSV} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {/* Search & Filters */}
        <Card className="shadow-sm border-muted">
          <CardContent className="p-6 space-y-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search entries by tasks, issues, or locations..."
                  className="pl-10 h-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Date Range Picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-10 justify-start text-left font-normal min-w-[240px]">
                      <Calendar className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>

                <Button
                  variant={showAdvancedFilters ? "secondary" : "outline"}
                  className="h-10 gap-2"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  <Settings2 className="w-4 h-4" />
                  Filters
                  {(tasksFilter.length + issuesFilter.length + itemsCarriedFilter.length + 
                    (waterCleaningStatusFilter !== 'all' ? 1 : 0) + 
                    (refrigerantWaterStatusFilter !== 'all' ? 1 : 0) + 
                    (filledCleaningWaterFilter !== 'all' ? 1 : 0) + 
                    (filledRefrigerantWaterFilter !== 'all' ? 1 : 0)) > 0 && (
                    <Badge variant="default" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                      {tasksFilter.length + issuesFilter.length + itemsCarriedFilter.length + 
                       (waterCleaningStatusFilter !== 'all' ? 1 : 0) + 
                       (refrigerantWaterStatusFilter !== 'all' ? 1 : 0) + 
                       (filledCleaningWaterFilter !== 'all' ? 1 : 0) + 
                       (filledRefrigerantWaterFilter !== 'all' ? 1 : 0)}
                    </Badge>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setUserFilter('all');
                    setLocationFilter('all');
                    setStatusFilter('all');
                    setTasksFilter([]);
                    setIssuesFilter([]);
                    setItemsCarriedFilter([]);
                    setWaterCleaningStatusFilter('all');
                    setRefrigerantWaterStatusFilter('all');
                    setFilledCleaningWaterFilter('all');
                    setFilledRefrigerantWaterFilter('all');
                    setDateRange({ from: subDays(new Date(), 30), to: new Date() });
                  }}
                  className="text-muted-foreground h-10"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* User Filter */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Team Member</Label>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="h-10">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary" />
                      <SelectValue placeholder="All Members" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Members</SelectItem>
                    {uniqueUsers.map(user => (
                      <SelectItem key={user} value={user}>{user}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location Filter */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</Label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="h-10">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <SelectValue placeholder="All Locations" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {uniqueLocations.map(loc => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10">
                    <div className="flex items-center gap-2">
                      <ListFilter className="w-4 h-4 text-primary" />
                      <SelectValue placeholder="All Statuses" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Complete">Complete</SelectItem>
                    <SelectItem value="Step 3 Pending">Step 3 Pending</SelectItem>
                    <SelectItem value="Step 2 Pending">Step 2 Pending</SelectItem>
                    <SelectItem value="Step 1 Pending">Step 1 Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {showAdvancedFilters && (
              <>
                <Separator className="bg-muted-foreground/10" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                  {/* Detailed Multi-selects */}
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Detailed Selection</Label>
                    <div className="grid gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="h-10 w-full justify-between">
                            <span className="truncate flex items-center gap-2">
                              <Wrench className="w-4 h-4 text-primary" />
                              Tasks {tasksFilter.length > 0 && `(${tasksFilter.length})`}
                            </span>
                            <ChevronDown className="w-4 h-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-2" align="start">
                          <div className="space-y-1">
                            {[
                              { label: 'Oranges Filled', value: 'oranges_filled' },
                              { label: 'Apples Filled', value: 'apples_filled' },
                              { label: 'Removed Peels', value: 'removed_peels' },
                              { label: 'Cleaned machine', value: 'cleaned_machine' },
                              { label: 'Cups/Lids kept', value: 'kept_cups_lids' },
                              { label: 'Parts changed', value: 'parts_changed' }
                            ].map(task => (
                              <div key={task.value} className="flex items-center space-x-2 p-1.5 hover:bg-muted rounded cursor-pointer" onClick={() => {
                                setTasksFilter(prev => prev.includes(task.value) ? prev.filter(t => t !== task.value) : [...prev, task.value]);
                              }}>
                                <Checkbox checked={tasksFilter.includes(task.value)} />
                                <span className="text-sm">{task.label}</span>
                              </div>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="h-10 w-full justify-between">
                            <span className="truncate flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                              Issues {issuesFilter.length > 0 && `(${issuesFilter.length})`}
                            </span>
                            <ChevronDown className="w-4 h-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[250px] p-2" align="start">
                          <ScrollArea className="h-[250px]">
                            <div className="space-y-1 p-1">
                              {[
                                'Cup error reported',
                                'Cover Slide fell',
                                'Cup holder not tight',
                                'Replenish Tray Error',
                                'Payment system error',
                                'Nayax Error',
                                'Internal leak',
                                'Parts changed'
                              ].map(issue => (
                                <div key={issue} className="flex items-center space-x-2 p-1.5 hover:bg-muted rounded cursor-pointer" onClick={() => {
                                  setIssuesFilter(prev => prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]);
                                }}>
                                  <Checkbox checked={issuesFilter.includes(issue)} />
                                  <span className="text-sm">{issue}</span>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </PopoverContent>
                      </Popover>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="h-10 w-full justify-between">
                            <span className="truncate flex items-center gap-2">
                              <Package className="w-4 h-4 text-orange-500" />
                              Items Carried {itemsCarriedFilter.length > 0 && `(${itemsCarriedFilter.length})`}
                            </span>
                            <ChevronDown className="w-4 h-4 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-2" align="start">
                          <ScrollArea className="h-[300px]">
                            <div className="space-y-1 p-1">
                              {[
                                "Boxes of Oranges",
                                "Boxes of Apples",
                                "Black Bins & Cleaning Materials",
                                "Empty Bins",
                                "Clean Water",
                                "Cups and Lids",
                                "Machine Parts",
                                "Glass Cleaner",
                                "Sanitizer",
                                "Paper towel",
                                "Cleaning Cloth"
                              ].map(item => (
                                <div key={item} className="flex items-center space-x-2 p-1.5 hover:bg-muted rounded cursor-pointer" onClick={() => {
                                  setItemsCarriedFilter(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
                                }}>
                                  <Checkbox checked={itemsCarriedFilter.includes(item)} />
                                  <span className="text-sm">{item}</span>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Water Management */}
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Water Status</Label>
                    <div className="grid grid-cols-1 gap-2">
                      <Select value={waterCleaningStatusFilter} onValueChange={setWaterCleaningStatusFilter}>
                        <SelectTrigger className="h-10">
                          <div className="flex items-center gap-2">
                            <Droplets className="w-4 h-4 text-blue-500" />
                            <SelectValue placeholder="Cleaning Water" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Cleaning Levels</SelectItem>
                          <SelectItem value="0 - 20%">0 - 20%</SelectItem>
                          <SelectItem value="20 - 40%">20 - 40%</SelectItem>
                          <SelectItem value="40 - 60%">40 - 60%</SelectItem>
                          <SelectItem value="60 - 80%">60 - 80%</SelectItem>
                          <SelectItem value="80 - 100%">80 - 100%</SelectItem>
                        </SelectContent>
                      </Select>

                      <Select value={refrigerantWaterStatusFilter} onValueChange={setRefrigerantWaterStatusFilter}>
                        <SelectTrigger className="h-10">
                          <div className="flex items-center gap-2">
                            <Droplets className="w-4 h-4 text-cyan-500" />
                            <SelectValue placeholder="Refrigerant Water" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Refrigerant Levels</SelectItem>
                          <SelectItem value="0 - 20%">0 - 20%</SelectItem>
                          <SelectItem value="20 - 40%">20 - 40%</SelectItem>
                          <SelectItem value="40 - 60%">40 - 60%</SelectItem>
                          <SelectItem value="60 - 80%">60 - 80%</SelectItem>
                          <SelectItem value="80 - 100%">80 - 100%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Filling Status */}
                  <div className="space-y-3">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Water Filling</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground">Cleaning</Label>
                        <Select value={filledCleaningWaterFilter} onValueChange={setFilledCleaningWaterFilter}>
                          <SelectTrigger className="h-10 text-xs">
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] text-muted-foreground">Refrigerant</Label>
                        <Select value={filledRefrigerantWaterFilter} onValueChange={setFilledRefrigerantWaterFilter}>
                          <SelectTrigger className="h-10 text-xs">
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="Yes">Yes</SelectItem>
                            <SelectItem value="No">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="entries" className="space-y-4">
          <TabsList>
            <TabsTrigger value="entries">All Entries</TabsTrigger>
            <TabsTrigger value="trips">Maintenance Trips</TabsTrigger>
          </TabsList>

          <TabsContent value="entries">
            {/* Entries List */}
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
                ) : isMobile ? (
                  // Mobile Cards View
                  <div className="space-y-4">
                    {filteredEntries.map(renderMobileCard)}
                  </div>
                ) : (
                  // Desktop Table View
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent border-muted">
                          <TableHead className="cursor-pointer font-bold text-foreground" onClick={() => requestSort('filled_by')}>
                            <div className="flex items-center gap-2 hover:text-primary transition-colors">
                              User <ArrowUpDown className="w-3 h-3" />
                            </div>
                          </TableHead>
                          <TableHead className="cursor-pointer font-bold text-foreground" onClick={() => requestSort('date_of_entry')}>
                            <div className="flex items-center gap-2 hover:text-primary transition-colors">
                              Date <ArrowUpDown className="w-3 h-3" />
                            </div>
                          </TableHead>
                          <TableHead className="font-bold text-foreground">Start Location</TableHead>
                          <TableHead className="font-bold text-foreground">End Location</TableHead>
                          <TableHead className="font-bold text-foreground">Work Performed</TableHead>
                          <TableHead className="cursor-pointer font-bold text-foreground" onClick={() => requestSort('status')}>
                            <div className="flex items-center gap-2 hover:text-primary transition-colors">
                              Status <ArrowUpDown className="w-3 h-3" />
                            </div>
                          </TableHead>
                          <TableHead className="cursor-pointer font-bold text-foreground" onClick={() => requestSort('created_at')}>
                            <div className="flex items-center gap-2 hover:text-primary transition-colors">
                              Logs <ArrowUpDown className="w-3 h-3" />
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEntries.map((entry) => (
                          <TableRow
                            key={entry.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleEntryClick(entry)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{entry.filled_by}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {formatVancouverDateTime(entry.date_of_entry, false)}
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
                               <div className="max-w-[200px] flex flex-wrap gap-1">
                                 {entry.tasks_completed?.split(',').map((task, i) => (
                                   <Badge key={i} variant="outline" className="text-[10px] py-0 px-1 bg-blue-50/50 text-blue-700 border-blue-200">
                                     {task.trim()}
                                   </Badge>
                                 )) || <span className="text-muted-foreground text-xs">-</span>}
                                 {entry.issues_errors?.split(',').map((issue, i) => (
                                   <Badge key={i} variant="outline" className="text-[10px] py-0 px-1 bg-red-50/50 text-red-700 border-red-200">
                                     {issue.trim()}
                                   </Badge>
                                 ))}
                               </div>
                             </TableCell>
                            <TableCell>
                              {getStatusBadge(entry)}
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {formatVancouverDateTime(entry.created_at)}
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
          </TabsContent>

          <TabsContent value="trips">
            {/* Trips List */}
            <div className="space-y-4">
              {trips.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>No trips found.</AlertDescription>
                </Alert>
              ) : (
                trips.map(trip => (
                  <Card key={trip.id} className="overflow-hidden">
                    <div
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setExpandedTrip(expandedTrip === trip.id ? null : trip.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <Route className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold flex items-center gap-2">
                            {trip.user}
                            <Badge variant={trip.status === 'Complete' ? 'default' : 'secondary'}>
                              {trip.status}
                            </Badge>
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(trip.date).toLocaleDateString()} • {trip.entries.length} Stops
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="hidden md:block text-right">
                          <div className="text-sm font-medium">{trip.totalDistance} km</div>
                          <div className="text-xs text-muted-foreground">Total Distance</div>
                        </div>
                        <div className="hidden md:block text-right">
                          <div className="text-sm font-medium">{trip.totalDuration} min</div>
                          <div className="text-xs text-muted-foreground">Total Duration</div>
                        </div>
                        <div className="hidden md:block text-right">
                          <div className="text-sm font-medium">{trip.totalBatteryConsumed}%</div>
                          <div className="text-xs text-muted-foreground">Battery Consumed</div>
                        </div>
                        {expandedTrip === trip.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>

                    {expandedTrip === trip.id && (
                      <div className="border-t bg-muted/10 p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <Card className="bg-background">
                            <CardContent className="p-4 flex items-center gap-3">
                              <Clock className="w-8 h-8 text-blue-500" />
                              <div>
                                <p className="text-sm text-muted-foreground">Duration</p>
                                <p className="text-xl font-bold">{trip.totalDuration} min</p>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="bg-background">
                            <CardContent className="p-4 flex items-center gap-3">
                              <MapPin className="w-8 h-8 text-green-500" />
                              <div>
                                <p className="text-sm text-muted-foreground">Distance</p>
                                <p className="text-xl font-bold">{trip.totalDistance} km</p>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="bg-background">
                            <CardContent className="p-4 flex items-center gap-3">
                              <Battery className="w-8 h-8 text-orange-500" />
                              <div>
                                <p className="text-sm text-muted-foreground">Battery Consumed</p>
                                <p className="text-xl font-bold">{trip.totalBatteryConsumed}%</p>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                          <Route className="w-4 h-4" /> Trip Timeline
                        </h4>

                        <div className="relative border-l-2 border-muted ml-4 space-y-8 pb-4">
                          {trip.entries.map((entry, idx) => (
                            <div key={entry.id} className="relative pl-6">
                              <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-background border-2 border-primary" />
                              <div
                                className="bg-background border rounded-lg p-3 cursor-pointer hover:shadow-md transition-all"
                                onClick={() => handleEntryClick(entry)}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div>
                                    <span className="font-semibold">{entry.start_location}</span>
                                    <span className="text-muted-foreground mx-2">→</span>
                                    <span className="font-semibold">{entry.end_location}</span>
                                  </div>
                                  <Badge variant="outline">{entry.start_time} - {entry.end_time}</Badge>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                                  <div>Dist: {entry.distance}km</div>
                                  <div>Dur: {entry.duration_minutes}min</div>
                                  <div>Batt: {entry.battery_start}% → {entry.battery_end}%</div>
                                  <div>Temp: {entry.temperature}°C</div>
                                </div>
                                {entry.issues_errors && (
                                  <div className="mt-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/10 p-2 rounded">
                                    Issue: {entry.issues_errors}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Details Modal */}
        <MaintenanceDetailsDialog
          open={showDetails}
          onOpenChange={setShowDetails}
          entry={selectedEntry}
          onPreviousEntry={handlePreviousEntry}
          onNextEntry={handleNextEntry}
          currentIndex={currentEntryIndex}
          totalEntries={filteredEntries.length}
        />

      </div>
    </div>
  );
};

export default EntriesPage;