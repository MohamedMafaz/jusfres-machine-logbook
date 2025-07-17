import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Wrench, Coffee, Thermometer, Clock, Package, Droplets } from 'lucide-react';
import { MaintenanceEntry } from '@/types/maintenance';

interface Step3Props {
  formData: Partial<MaintenanceEntry>;
  onUpdate: (data: Partial<MaintenanceEntry>) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

const Step3: React.FC<Step3Props> = ({ formData, onUpdate, onSubmit, isLoading }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-maintenance rounded-xl flex items-center justify-center shadow-maintenance">
            <Wrench className="w-8 h-8 text-white" />
          </div>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Machine Stats</h1>
          <p className="text-muted-foreground">Step 3 of 3 • Final maintenance details</p>
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
          <div className="w-3 h-3 bg-maintenance-secondary rounded-full"></div>
          <span className="text-sm text-maintenance-secondary font-medium">Step 2 Complete</span>
        </div>
        <div className="w-8 h-px bg-border"></div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-primary rounded-full"></div>
          <span className="text-sm text-primary font-medium">Step 3 Current</span>
        </div>
      </div>

      {/* Form Cards */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Machine Supplies */}
        <Card className="shadow-card-custom">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coffee className="w-5 h-5 text-maintenance-primary" />
              Machine Supplies
            </CardTitle>
            <CardDescription>Record current supply levels</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-2">
              <Label htmlFor="cup_availability">Cup Availability (Reels)</Label>
              <Input
                id="cup_availability"
                type="number"
                value={formData.cup_availability || ''}
                onChange={(e) => onUpdate({ cup_availability: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lid_availability">Lid Availability (Reels)</Label>
              <Input
                id="lid_availability"
                type="number"
                value={formData.lid_availability || ''}
                onChange={(e) => onUpdate({ lid_availability: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="orange_refill">Orange Refill</Label>
              <Input
                id="orange_refill"
                type="number"
                value={formData.orange_refill || ''}
                onChange={(e) => onUpdate({ orange_refill: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature" className="flex items-center gap-2">
                <Thermometer className="w-4 h-4" />
                Temperature
              </Label>
              <Input
                id="temperature"
                type="number"
                step="0.01"
                value={formData.temperature || ''}
                onChange={(e) => onUpdate({ temperature: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

          </CardContent>
        </Card>

        {/* Tasks and Issues */}
        <Card className="shadow-card-custom">
          <CardHeader>
            <CardTitle>Tasks & Issues</CardTitle>
            <CardDescription>Document work performed and any problems encountered</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="space-y-2">
              <Label htmlFor="tasks_completed">Tasks Completed</Label>
              <Textarea
                id="tasks_completed"
                value={formData.tasks_completed || ''}
                onChange={(e) => onUpdate({ tasks_completed: e.target.value })}
                placeholder="Describe tasks that were completed..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issues_errors">Issues/Errors Reported</Label>
              <Textarea
                id="issues_errors"
                value={formData.issues_errors || ''}
                onChange={(e) => onUpdate({ issues_errors: e.target.value })}
                placeholder="Report any issues or errors encountered..."
                rows={3}
              />
            </div>

          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="shadow-card-custom">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-maintenance-primary" />
              Performance Metrics
            </CardTitle>
            <CardDescription>Record performance and timing data</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <div className="space-y-2">
              <Label htmlFor="distance">Distance (km)</Label>
              <Input
                id="distance"
                type="number"
                step="0.01"
                value={formData.distance || ''}
                onChange={(e) => onUpdate({ distance: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Duration (minutes)</Label>
              <Input
                id="duration_minutes"
                type="number"
                value={formData.duration_minutes || ''}
                onChange={(e) => onUpdate({ duration_minutes: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time_spent_machine">Time Spent on Machine (minutes)</Label>
              <Input
                id="time_spent_machine"
                type="number"
                value={formData.time_spent_machine || ''}
                onChange={(e) => onUpdate({ time_spent_machine: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

          </CardContent>
        </Card>

        {/* Box Inventory */}
        <Card className="shadow-card-custom">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-maintenance-primary" />
              Box Inventory
            </CardTitle>
            <CardDescription>Record box quantities</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="space-y-2">
              <Label htmlFor="boxes_88">88 Boxes</Label>
              <Input
                id="boxes_88"
                type="number"
                value={formData.boxes_88 || ''}
                onChange={(e) => onUpdate({ boxes_88: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="boxes_113">113 Boxes</Label>
              <Input
                id="boxes_113"
                type="number"
                value={formData.boxes_113 || ''}
                onChange={(e) => onUpdate({ boxes_113: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="boxes_custom">Custom Boxes</Label>
              <Input
                id="boxes_custom"
                type="number"
                value={formData.boxes_custom || ''}
                onChange={(e) => onUpdate({ boxes_custom: parseInt(e.target.value) || 0 })}
                placeholder="0"
              />
            </div>

          </CardContent>
        </Card>

        {/* Water Systems */}
        <Card className="shadow-card-custom">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Droplets className="w-5 h-5 text-maintenance-primary" />
              Water Systems
            </CardTitle>
            <CardDescription>Water system status and maintenance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Water Status Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status of Machine - Water for Cleaning</Label>
                <Select 
                  value={formData.water_cleaning_status || ''} 
                  onValueChange={(value) => onUpdate({ water_cleaning_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full</SelectItem>
                    <SelectItem value="half">Half</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="empty">Empty</SelectItem>
                    <SelectItem value="needs_maintenance">Needs Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status of Machine - Refrigerant Water</Label>
                <Select 
                  value={formData.refrigerant_water_status || ''} 
                  onValueChange={(value) => onUpdate({ refrigerant_water_status: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">Full</SelectItem>
                    <SelectItem value="half">Half</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="empty">Empty</SelectItem>
                    <SelectItem value="needs_maintenance">Needs Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Water Fill Switches */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="filled_cleaning_water">Filled with water - Cleaning Water</Label>
                <Switch
                  id="filled_cleaning_water"
                  checked={formData.filled_cleaning_water || false}
                  onCheckedChange={(checked) => onUpdate({ filled_cleaning_water: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="filled_refrigerant_water">Filled with water - Refrigerant Water</Label>
                <Switch
                  id="filled_refrigerant_water"
                  checked={formData.filled_refrigerant_water || false}
                  onCheckedChange={(checked) => onUpdate({ filled_refrigerant_water: checked })}
                />
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button 
            type="submit" 
            size="lg"
            className="w-full max-w-md bg-maintenance-secondary hover:bg-maintenance-secondary/90"
            disabled={isLoading}
          >
            {isLoading ? 'Completing Entry...' : 'Complete Maintenance Entry'}
          </Button>
        </div>

      </form>

    </div>
  );
};

export default Step3;