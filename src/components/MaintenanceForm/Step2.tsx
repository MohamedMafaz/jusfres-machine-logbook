import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Clock, Gauge, Battery, CheckCircle } from 'lucide-react';
import { MaintenanceEntry } from '@/types/maintenance';
import { Slider } from "@/components/ui/slider";

interface Step2Props {
  formData: Partial<MaintenanceEntry>;
  onUpdate: (data: Partial<MaintenanceEntry>) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const Step2: React.FC<Step2Props> = ({ formData, onUpdate, onSubmit, isLoading }) => {
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
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">End Details</h1>
          <p className="text-muted-foreground">Step 2 of 3 • Completion information</p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-maintenance-secondary rounded-full"></div>
          <span className="text-sm text-maintenance-secondary font-medium">Step 1 Complete</span>
        </div>
        <div className="w-8 h-px bg-border"></div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-primary rounded-full"></div>
          <span className="text-sm text-primary font-medium">Step 2 Current</span>
        </div>
        <div className="w-8 h-px bg-border"></div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-muted rounded-full"></div>
          <span className="text-sm text-muted-foreground">Step 3 Pending</span>
        </div>
      </div>

      {/* Form Card */}
      <Card className="shadow-card-custom">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-maintenance-primary" />
            End Information
          </CardTitle>
          <CardDescription>
            Record details after completing the maintenance visit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* End Location */}
            <div className="space-y-2">
              <Label htmlFor="end_location">End Location</Label>
              <select
                id="end_location"
                value={formData.end_location || ''}
                onChange={(e) => onUpdate({ end_location: e.target.value })}
                required
                className="w-full border rounded px-3 py-2 bg-background text-foreground"
              >
                <option value="" disabled>Select ending location</option>
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

            {/* End Time */}
            <div className="space-y-2">
              <Label htmlFor="end_time" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                End Time
              </Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time || ''}
                onChange={(e) => onUpdate({ end_time: e.target.value })}
                required
              />
            </div>

            {/* Odometer at End */}
            <div className="space-y-2">
              <Label htmlFor="odometer_end" className="flex items-center gap-2">
                <Gauge className="w-4 h-4" />
                Odometer at End (km)
              </Label>
              <Input
                id="odometer_end"
                type="number"
                value={formData.odometer_end || ''}
                onChange={(e) => onUpdate({ odometer_end: parseInt(e.target.value) || 0 })}
                placeholder="0"
                required
              />
            </div>

            {/* Battery/Charge at End */}
            <div className="space-y-2">
              <Label htmlFor="battery_end" className="flex items-center gap-2">
                <Battery className="w-4 h-4" />
                Battery/Charge at End (%)
                <span className="ml-2 font-mono text-sm text-muted-foreground">{formData.battery_end ?? 0}%</span>
              </Label>
              <Slider
                id="battery_end"
                min={0}
                max={100}
                step={1}
                value={[formData.battery_end ?? 0]}
                onValueChange={([val]) => onUpdate({ battery_end: val })}
                className="w-full"
              />
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary-hover"
              disabled={isLoading}
            >
              {isLoading ? 'Saving Step 2...' : 'Complete Step 2 & Continue'}
            </Button>

          </form>
        </CardContent>
      </Card>

    </div>
  );
};

export default Step2;