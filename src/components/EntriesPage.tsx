import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { MaintenanceEntry } from '@/types/maintenance';
import { getHomeBaseForUser } from '@/constants/locations';
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
  ChevronUp
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

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

    // Process trips from filtered entries (or all entries if search is empty? Better to process all then filter trips)
    // For now, let's process ALL entries into trips, then filter trips if needed.
    // But user might want to search within trips.
    // Let's process ALL entries to build trips correctly (since a trip might span across search terms).
    const processedTrips = groupEntriesIntoTrips(entries);

    // Filter trips based on search term (if user matches, or any entry in trip matches)
    const filteredTrips = processedTrips.filter(trip =>
      trip.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.entries.some(e =>
        e.start_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.end_location?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setTrips(filteredTrips);

  }, [entries, searchTerm]);

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
      'Boxes (88)',
      'Boxes (113)',
      'Custom Boxes',
      'Orange Refill',
      'Cup Availability',
      'Lid Availability',
      'Cleaning Water Status',
      'Refrigerant Water Status',
      'Filled Cleaning Water',
      'Filled Refrigerant Water',
      'Items Carried',
      'Tasks Completed',
      'Issues/Errors',
      'Status',
      'Created At'
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
        entry.orange_88_count ?? entry.boxes_88 ?? '',
        entry.orange_113_count ?? entry.boxes_113 ?? '',
        entry.orange_custom_box_count ?? entry.boxes_custom ?? '',
        entry.orange_refill || '',
        entry.cup_availability || '',
        entry.lid_availability || '',
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
        `"${status}"`,
        `"${entry.created_at || ''}"`
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
            {new Date(entry.date_of_entry || '').toLocaleDateString()}
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
        </div>
      </CardContent>
    </Card>
  );

  const renderDetailsModal = () => (
    <Dialog open={showDetails} onOpenChange={setShowDetails}>
      <DialogContent className={`${isMobile ? 'w-[98vw] max-w-none px-1 py-2' : 'max-w-2xl'} max-h-[95vh] overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : 'text-xl'}`}>
            <Calendar className="w-5 h-5" />
            Maintenance Entry Details
          </DialogTitle>
        </DialogHeader>
        {selectedEntry && (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className={`${isMobile ? 'grid grid-cols-1 gap-2' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}`}>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">User:</span>
                  <span>{selectedEntry.filled_by}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Date:</span>
                  <span>{new Date(selectedEntry.date_of_entry || '').toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Status:</span>
                  {getStatusBadge(selectedEntry)}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Start:</span>
                  <span>{selectedEntry.start_location || '-'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">End:</span>
                  <span>{selectedEntry.end_location || '-'}</span>
                </div>
                {selectedEntry.distance && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Distance:</span>
                    <span>{selectedEntry.distance} km</span>
                  </div>
                )}
              </div>
            </div>
            <Separator />
            {/* Times */}
            <div className={`${isMobile ? 'grid grid-cols-1 gap-2' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}`}>
              <div className="space-y-2">
                <h3 className={`font-semibold flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}> <Clock className="w-4 h-4" /> Time Information </h3>
                <div className="space-y-1 text-sm">
                  <div>Start: {selectedEntry.start_time || '-'}</div>
                  <div>End: {selectedEntry.end_time || '-'}</div>
                  {selectedEntry.duration_minutes ? (
                    <div>Duration: {selectedEntry.duration_minutes} minutes</div>
                  ) : null}
                  {selectedEntry.time_spent_machine ? (
                    <div>Machine Time: {selectedEntry.time_spent_machine} minutes</div>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2">
                <h3 className={`font-semibold flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}> <Thermometer className="w-4 h-4" /> Environmental Data </h3>
                <div className="space-y-1 text-sm">
                  <div>Temperature: {selectedEntry.temperature || '-'}°C</div>
                  <div>Battery Start: {selectedEntry.battery_start || '-'}%</div>
                  <div>Battery End: {selectedEntry.battery_end || '-'}%</div>
                  <div>Odometer Start: {selectedEntry.odometer_start || '-'} km</div>
                  <div>Odometer End: {selectedEntry.odometer_end || '-'} km</div>
                </div>
              </div>
            </div>
            <Separator />
            {/* Inventory */}
            <div className="space-y-2">
              <h3 className={`font-semibold flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}> <Package className="w-4 h-4" /> Inventory & Supplies </h3>
              <div className={`${isMobile ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-2 md:grid-cols-4'}`}>
                <div>Boxes (88): {selectedEntry.orange_88_count ?? selectedEntry.boxes_88 ?? '-'}</div>
                <div>Boxes (113): {selectedEntry.orange_113_count ?? selectedEntry.boxes_113 ?? '-'}</div>
                <div>Custom Boxes: {selectedEntry.orange_custom_box_count ?? selectedEntry.boxes_custom ?? '-'}</div>
                <div>Orange Refill: {selectedEntry.orange_refill || '-'}</div>
                <div>Cup Availability: {selectedEntry.cup_availability || '-'}</div>
                <div>Lid Availability: {selectedEntry.lid_availability || '-'}</div>
              </div>
            </div>
            <Separator />
            {/* Water Status */}
            <div className={`${isMobile ? 'grid grid-cols-1 gap-2' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}`}>
              <div className="space-y-2">
                <h3 className={`font-semibold flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}> <Droplets className="w-4 h-4" /> Water Management </h3>
                <div className="space-y-1 text-sm">
                  <div>Cleaning Water: {selectedEntry.water_cleaning_status || '-'}</div>
                  <div>Refrigerant Water: {selectedEntry.refrigerant_water_status || '-'}</div>
                  <div>Filled Cleaning: {typeof selectedEntry.filled_cleaning_water === 'string' ? selectedEntry.filled_cleaning_water : (selectedEntry.filled_cleaning_water === true ? 'Yes' : selectedEntry.filled_cleaning_water === false ? 'No' : '-')}</div>
                  <div>Filled Refrigerant: {typeof selectedEntry.filled_refrigerant_water === 'string' ? selectedEntry.filled_refrigerant_water : (selectedEntry.filled_refrigerant_water === true ? 'Yes' : selectedEntry.filled_refrigerant_water === false ? 'No' : '-')}</div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className={`font-semibold flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}> <Package className="w-4 h-4" /> Items Carried </h3>
                <div className="text-sm"> {
                  selectedEntry.items_carried
                    ? (Array.isArray(selectedEntry.items_carried)
                      ? selectedEntry.items_carried.join(', ')
                      : (typeof selectedEntry.items_carried === 'string' && selectedEntry.items_carried.includes(',')
                        ? selectedEntry.items_carried.split(',').map(i => i.trim()).filter(Boolean).join(', ')
                        : selectedEntry.items_carried))
                    : '-'
                } </div>
              </div>
            </div>
            <Separator />
            {/* Tasks */}
            {selectedEntry.tasks_completed && (
              <>
                <div className="space-y-2">
                  <h3 className={`font-semibold flex items-center gap-2 ${isMobile ? 'text-base' : ''}`}> <CheckCircle className="w-4 h-4" /> Tasks Completed </h3>
                  <div className="text-sm bg-green-50 p-3 rounded-lg"> {selectedEntry.tasks_completed} </div>
                </div>
                <Separator />
              </>
            )}
            {/* Issues */}
            {selectedEntry.issues_errors && (
              <div className="space-y-2">
                <h3 className={`font-semibold flex items-center gap-2 text-orange-600 ${isMobile ? 'text-base' : ''}`}> <AlertTriangle className="w-4 h-4" /> Issues & Errors </h3>
                <div className="text-sm bg-orange-50 p-3 rounded-lg"> {selectedEntry.issues_errors} </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
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
        {renderDetailsModal()}

      </div>
    </div>
  );
};

export default EntriesPage;