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
              <select
                id="start_location"
                value={formData.start_location || ''}
                onChange={(e) => onUpdate({ start_location: e.target.value })}
                required
                className="w-full border rounded px-3 py-2 bg-background text-foreground"
              >
                <option value="" disabled>Select starting location</option>
                <option value="Husky">Husky</option>
                <option value="Sabzi Mandi">Sabzi Mandi</option>
                <option value="Translink China">Translink China</option>
                <option value="Metro China">Metro China</option>
                <option value="Capstan Station">Capstan Station</option>
                <option value="Edmonds China">Edmonds China</option>
                <option value="Surrey China">Surrey China</option>
                <option value="Canadian Tire">Canadian Tire</option>
                <option value="Rupert Station">Rupert Station</option>
                <option value="Lougheed Station">Lougheed Station</option>
                <option value="UBC">UBC</option>
                <option value="Warehouse">Warehouse</option>
                <option value="Ashok sir's House">Ashok sir's House</option>
                <option value="Bradner's (Cold Storage)">Bradner's (Cold Storage)</option>
              </select>
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
              <div className="space-y-1">
                {[
                  'Boxes of Oranges',
                  'Black Bins & Cleaning Materials',
                  'Empty Bins',
                  'Clean Water',
                  'Machine Parts',
                ].map((item) => {
                  // Ensure items_carried is always treated as an array for checkboxes
                  const carriedArray = Array.isArray(formData.items_carried)
                    ? formData.items_carried
                    : (formData.items_carried ? formData.items_carried.split(',').map(i => i.trim()) : []);
                  return (
                    <label key={item} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={item}
                        checked={carriedArray.includes(item)}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          let newItems = [...carriedArray];
                          if (isChecked) {
                            if (!newItems.includes(item)) newItems.push(item);
                          } else {
                            newItems = newItems.filter(i => i !== item);
                          }
                          // Remove empty strings and duplicates, then join
                          const cleanItems = Array.from(new Set(newItems.map(i => i.trim()).filter(Boolean)));
                          onUpdate({ items_carried: cleanItems.join(', ') });
                        }}
                      />
                      <span>{item}</span>
                    </label>
                  );
                })}
              </div>
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