import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ClipboardList, MapPin, Clock, Gauge, Battery } from 'lucide-react';
import { MaintenanceEntry } from '@/types/maintenance';

interface Step1Props {
  formData: Partial<MaintenanceEntry>;
  onUpdate: (data: Partial<MaintenanceEntry>) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const Step1: React.FC<Step1Props> = ({ formData, onUpdate, onSubmit, isLoading }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-maintenance rounded-xl flex items-center justify-center shadow-maintenance">
            <ClipboardList className="w-8 h-8 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Start Details</h1>
          <p className="text-muted-foreground">Step 1 of 3 • Initial maintenance information</p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="shadow-card-custom">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-maintenance-primary" />
            Start Information
          </CardTitle>
          <CardDescription>
            Record the initial details before beginning maintenance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Filled By - Auto-filled and read-only */}
            <div className="space-y-2">
              <Label htmlFor="filled_by">Filled By</Label>
              <Input
                id="filled_by"
                value={formData.filled_by || ''}
                readOnly
                className="bg-muted"
              />
            </div>

            {/* Date of Entry */}
            <div className="space-y-2">
              <Label htmlFor="date_of_entry">Date of Entry</Label>
              <Input
                id="date_of_entry"
                type="date"
                value={formData.date_of_entry || ''}
                onChange={(e) => onUpdate({ date_of_entry: e.target.value })}
                required
              />
            </div>

            {/* Start Location */}
            <div className="space-y-2">
              <Label htmlFor="start_location">Start Location</Label>
              <Input
                id="start_location"
                value={formData.start_location || ''}
                onChange={(e) => onUpdate({ start_location: e.target.value })}
                placeholder="Enter starting location"
                required
              />
            </div>

            {/* Start Time */}
            <div className="space-y-2">
              <Label htmlFor="start_time" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Start Time
              </Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time || ''}
                onChange={(e) => onUpdate({ start_time: e.target.value })}
                required
              />
            </div>

            {/* Odometer at Start */}
            <div className="space-y-2">
              <Label htmlFor="odometer_start" className="flex items-center gap-2">
                <Gauge className="w-4 h-4" />
                Odometer at Start (km)
              </Label>
              <Input
                id="odometer_start"
                type="number"
                value={formData.odometer_start || ''}
                onChange={(e) => onUpdate({ odometer_start: parseInt(e.target.value) || 0 })}
                placeholder="0"
                required
              />
            </div>

            {/* Battery/Charge at Start */}
            <div className="space-y-2">
              <Label htmlFor="battery_start" className="flex items-center gap-2">
                <Battery className="w-4 h-4" />
                Battery/Charge at Start (%)
              </Label>
              <Input
                id="battery_start"
                type="number"
                min="0"
                max="100"
                value={formData.battery_start || ''}
                onChange={(e) => onUpdate({ battery_start: parseInt(e.target.value) || 0 })}
                placeholder="0"
                required
              />
            </div>

            {/* Items Carried at Start */}
            <div className="space-y-2">
              <Label htmlFor="items_carried">Items Carried at Start</Label>
              <Textarea
                id="items_carried"
                value={formData.items_carried || ''}
                onChange={(e) => onUpdate({ items_carried: e.target.value })}
                placeholder="List items being carried..."
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary-hover"
              disabled={isLoading}
            >
              {isLoading ? 'Saving Step 1...' : 'Complete Step 1 & Continue'}
            </Button>

          </form>
        </CardContent>
      </Card>

    </div>
  );
};

export default Step1;