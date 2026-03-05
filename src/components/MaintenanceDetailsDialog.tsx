import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MaintenanceEntry } from '@/types/maintenance';
import { formatVancouverDateTime } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle,
  Thermometer,
  Battery,
  Package,
  Droplets,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Citrus,
  Apple
} from 'lucide-react';

interface MaintenanceDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: MaintenanceEntry | null;
  onPreviousEntry?: () => void;
  onNextEntry?: () => void;
  currentIndex?: number;
  totalEntries?: number;
}

const MaintenanceDetailsDialog: React.FC<MaintenanceDetailsDialogProps> = ({
  open,
  onOpenChange,
  entry,
  onPreviousEntry,
  onNextEntry,
  currentIndex,
  totalEntries
}) => {
  const isMobile = useIsMobile();

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

  const renderItemsCarried = (items: string | string[] | undefined) => {
    if (!items) return '-';
    if (Array.isArray(items)) return items.join(', ');
    if (typeof items === 'string' && items.includes(',')) {
      return items.split(',').map(i => i.trim()).filter(Boolean).join(', ');
    }
    return items;
  };

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${isMobile ? 'w-[98vw] max-w-none px-4 py-4' : 'max-w-3xl'} max-h-[95vh] flex flex-col p-0 overflow-hidden`}>
        <DialogHeader className="p-6 pb-2 border-b">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle className={`flex items-center gap-2 ${isMobile ? 'text-base' : 'text-xl'}`}>
              <Calendar className="w-5 h-5 text-primary" />
              Maintenance Entry Details
            </DialogTitle>
            {(onPreviousEntry || onNextEntry) && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onPreviousEntry}
                  disabled={currentIndex !== undefined && currentIndex <= 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-xs text-muted-foreground min-w-[60px] text-center">
                  {(currentIndex ?? 0) + 1} / {totalEntries ?? 1}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={onNextEntry}
                  disabled={currentIndex !== undefined && totalEntries !== undefined && currentIndex >= totalEntries - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className={`${isMobile ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-2 gap-8'}`}>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">General Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-primary/70" />
                    <span className="text-sm font-medium">User:</span>
                    <span className="text-sm">{entry.filled_by}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-primary/70" />
                    <span className="text-sm font-medium">Date:</span>
                    <span className="text-sm">{formatVancouverDateTime(entry.date_of_entry, false)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-4 h-4 text-primary/70" />
                    <span className="text-sm font-medium">Status:</span>
                    {getStatusBadge(entry)}
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Location & Trip</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-primary/70" />
                    <span className="text-sm font-medium">Start:</span>
                    <span className="text-sm">{entry.start_location || '-'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-primary/70" />
                    <span className="text-sm font-medium">End:</span>
                    <span className="text-sm">{entry.end_location || '-'}</span>
                  </div>
                  {entry.distance && (
                    <div className="flex items-center gap-3">
                      <Route className="w-4 h-4 text-primary/70" />
                      <span className="text-sm font-medium">Distance:</span>
                      <span className="text-sm font-semibold">{entry.distance} km</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Times & Enviro */}
            <div className={`${isMobile ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-2 gap-8'}`}>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Time Breakdown</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-muted/50 rounded-md">
                    <p className="text-[10px] text-muted-foreground uppercase">Start Time</p>
                    <p className="font-medium">{entry.start_time || '-'}</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-md">
                    <p className="text-[10px] text-muted-foreground uppercase">End Time</p>
                    <p className="font-medium">{entry.end_time || '-'}</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-md">
                    <p className="text-[10px] text-muted-foreground uppercase">Total Duration</p>
                    <p className="font-medium">{entry.duration_minutes ? `${entry.duration_minutes}m` : '-'}</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded-md">
                    <p className="text-[10px] text-muted-foreground uppercase">Machine Time</p>
                    <p className="font-medium">{entry.time_spent_machine ? `${entry.time_spent_machine}m` : '-'}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Environmental & Vehicle</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 bg-blue-50/50 dark:bg-blue-900/10 rounded-md border border-blue-100 dark:border-blue-900/30">
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 uppercase flex items-center gap-1">
                      <Thermometer className="w-2.5 h-2.5" /> Temp
                    </p>
                    <p className="font-bold text-blue-700 dark:text-blue-300">{entry.temperature ? `${entry.temperature}°C` : '-'}</p>
                    {entry.apple_temperature != null && (
                      <p className="font-bold text-red-700 dark:text-red-300 text-[10px] mt-1">Apple: {entry.apple_temperature}°C</p>
                    )}
                  </div>
                  <div className="p-2 bg-orange-50/50 dark:bg-orange-900/10 rounded-md border border-orange-100 dark:border-orange-900/30">
                    <p className="text-[10px] text-orange-600 dark:text-orange-400 uppercase flex items-center gap-1">
                      <Battery className="w-2.5 h-2.5" /> Battery
                    </p>
                    <p className="font-bold text-orange-700 dark:text-orange-300">{entry.battery_start ?? '-'}% → {entry.battery_end ?? '-'}%</p>
                  </div>
                  <div className="col-span-2 p-2 bg-muted/50 rounded-md">
                    <p className="text-[10px] text-muted-foreground uppercase">Odometer</p>
                    <p className="font-medium">{entry.odometer_start ?? '-'} km → {entry.odometer_end ?? '-'} km</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* ORANGE Inventory */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Citrus className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-orange-600">Orange Inventory & Placement</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 border rounded-lg bg-orange-50/20">
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">Total Placed</p>
                  <p className="text-2xl font-bold text-orange-700">{entry.oranges_placed ?? '-'}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">Refill Count</p>
                  <p className="text-xl font-semibold">{entry.orange_refill ?? '-'}</p>
                </div>
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">88 Count Boxes</p>
                  <p className="text-lg font-medium">{entry.orange_88_count ?? '-'}</p>
                </div>
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">113 Count Boxes</p>
                  <p className="text-lg font-medium">{entry.orange_113_count ?? '-'}</p>
                </div>
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">Custom Boxes</p>
                  <p className="text-lg font-medium">{entry.orange_custom_box_count ?? '-'}</p>
                </div>
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">Custom Count/Box</p>
                  <p className="text-lg font-medium">{entry.orange_custom_count_per_box ?? '-'}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* APPLE Inventory */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Apple className="w-5 h-5 text-red-500" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-red-600">Apple Inventory & Placement</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 border rounded-lg bg-red-50/20">
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">Total Placed</p>
                  <p className="text-2xl font-bold text-red-700">{entry.apples_placed ?? '-'}</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">Refill Count</p>
                  <p className="text-xl font-semibold">{entry.apple_refill ?? '-'}</p>
                </div>
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">88 Count Boxes</p>
                  <p className="text-lg font-medium">{entry.apple_88_count ?? '-'}</p>
                </div>
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">113 Count Boxes</p>
                  <p className="text-lg font-medium">{entry.apple_113_count ?? '-'}</p>
                </div>
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">Custom Boxes (A)</p>
                  <p className="text-lg font-medium">{entry.apple_custom_box_count ?? '-'}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Supplies & Water */}
            <div className={`${isMobile ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-2 gap-8'}`}>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Package className="w-4 h-4" /> Supplies & Consumables
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="p-2 border rounded-md">
                    <p className="text-[10px] text-muted-foreground uppercase">Cup Avail.</p>
                    <p className="font-medium text-orange-600 text-xs">O: {entry.cup_availability ?? '-'} Reels</p>
                     <p className="font-medium text-red-600 text-xs">A: {entry.apple_cup_availability ?? '-'} Reels</p>
                  </div>
                  <div className="p-2 border rounded-md">
                    <p className="text-[10px] text-muted-foreground uppercase">Lid Avail.</p>
                    <p className="font-medium text-orange-600 text-xs">O: {entry.lid_availability ?? '-'} Reels</p>
                     <p className="font-medium text-red-600 text-xs">A: {entry.apple_lid_availability ?? '-'} Reels</p>
                  </div>
                </div>
                <div className="p-3 border rounded-md bg-muted/20">
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">Items Carried</p>
                  <p className="text-sm leading-relaxed">{renderItemsCarried(entry.items_carried)}</p>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Droplets className="w-4 h-4" /> Water Management
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center p-2 border rounded-md">
                    <span className="text-muted-foreground">Cleaning Water Status</span>
                    <span className="font-semibold">{entry.water_cleaning_status || '-'}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 border rounded-md">
                    <span className="text-muted-foreground">Refrigerant Water Status</span>
                    <span className="font-semibold">{entry.refrigerant_water_status || '-'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 border rounded-md flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground uppercase">Refilled Cln.</span>
                      <Badge variant={entry.filled_cleaning_water ? "default" : "outline"}>
                        {entry.filled_cleaning_water ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                    <div className="p-2 border rounded-md flex justify-between items-center">
                      <span className="text-[10px] text-muted-foreground uppercase">Refilled Ref.</span>
                      <Badge variant={entry.filled_refrigerant_water ? "default" : "outline"}>
                        {entry.filled_refrigerant_water ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Tasks & Issues */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" /> Tasks Performed
                </h3>
                <div className="p-3 bg-green-50/50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20 rounded-lg text-sm leading-relaxed">
                  {entry.tasks_completed && <div><span className="font-bold text-orange-700">Orange:</span> {entry.tasks_completed}</div>}
                   {entry.apple_tasks_completed && <div><span className="font-bold text-red-700">Apple:</span> {entry.apple_tasks_completed}</div>}
                   {!entry.tasks_completed && !entry.apple_tasks_completed && 'No specific tasks documented.'}
                </div>
              </div>

              {entry.issues_errors && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2 text-red-600">
                    <AlertTriangle className="w-4 h-4 text-red-500" /> Issues & Errors
                  </h3>
                  <div className="p-3 bg-red-50/50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-lg text-sm font-medium text-red-700 dark:text-red-300 leading-relaxed shadow-sm">
                    {entry.issues_errors && <div><span className="font-bold text-orange-800">Orange:</span> {entry.issues_errors}</div>}
                     {entry.apple_issues_errors && <div className="mt-1"><span className="font-bold text-red-800">Apple:</span> {entry.apple_issues_errors}</div>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t bg-muted/5 font-mono text-[10px] text-muted-foreground flex justify-between">
          <span>ID: {entry.id}</span>
          <span>Created: {entry.created_at ? formatVancouverDateTime(entry.created_at) : '-'}</span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import { Route } from 'lucide-react';

export default MaintenanceDetailsDialog;
