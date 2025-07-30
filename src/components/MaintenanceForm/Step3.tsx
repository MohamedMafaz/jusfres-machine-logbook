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
              <Label htmlFor="cup_availability">Cup Availability (Reels) *</Label>
              <div className="flex items-center space-x-3">
                <Input
                  id="cup_availability"
                  type="range"
                  value={formData.cup_availability || 0}
                  onChange={(e) =>
                    onUpdate({ cup_availability: parseFloat(e.target.value) || 0 })
                  }
                  min={0}
                  max={3}
                  step={0.25}
                  required
                />
                <span className="text-sm text-gray-700">
                  {formData.cup_availability || 0}
                </span>
              </div>
            </div>

            {/* Number of Oranges Placed */}
            <div className="space-y-2">
              <Label htmlFor="oranges_placed">Number of Oranges Placed *</Label>
              <Input
                id="oranges_placed"
                type="number"
                min={0}
                value={formData.oranges_placed ?? ''}
                onChange={e => onUpdate({ oranges_placed: parseInt(e.target.value) || 0 })}
                placeholder="0"
                required
              />
            </div>


            <div className="space-y-2">
              <Label htmlFor="lid_availability">Lid Availability (Reels) *</Label>
              <div className="flex items-center space-x-3">
                <Input
                  id="lid_availability"
                  type="range"
                  value={formData.lid_availability || 0}
                  onChange={(e) =>
                    onUpdate({ lid_availability: parseFloat(e.target.value) || 0 })
                  }
                  min={0}
                  max={3}
                  step={0.25}
                  required
                />
                <span className="text-sm text-gray-700">
                  {formData.lid_availability || 0}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature" className="flex items-center gap-2">
                <Thermometer className="w-4 h-4" />
                Temperature *
              </Label>
              <Input
                id="temperature"
                type="number"
                step="0.01"
                value={formData.temperature || ''}
                onChange={(e) => onUpdate({ temperature: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                required
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
              <Label htmlFor="tasks_completed">Tasks Completed *</Label>
              <div className="grid gap-2">
                {[
                  { label: 'Oranges Filled', value: 'oranges_filled' },
                  { label: 'Removed Peels', value: 'removed_peels' },
                  { label: 'Cleaned the machine', value: 'cleaned_machine' },
                  { label: 'Kept cups and lids', value: 'kept_cups_lids' },
                  { label: 'Parts changed', value: 'parts_changed' }
                  
                ].map((item) => (
                  <label key={item.value} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={item.value}
                      checked={(formData.tasks_completed || []).includes(item.value)}
                      onChange={(e) => {
                        const value = e.target.value;
                        const currentTasks = Array.isArray(formData.tasks_completed)
                          ? formData.tasks_completed
                          : (formData.tasks_completed?.split(',') || []);
                        const newTasks = currentTasks.includes(value)
                          ? currentTasks.filter((v) => v !== value)
                          : [...currentTasks, value];
                        onUpdate({ tasks_completed: newTasks.join(', ') });
                      }}
                      className="accent-blue-600"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>



            <div className="space-y-2">
              <Label htmlFor="issues_errors">Issues/Errors Reported *</Label>
              <div className="grid gap-2">
                {[
                  'Cup error reported',
                  'Cover Slide fell',
                  'Cup holder not tight',
                  'Replenish Tray Error',
                  'Payment system error',
                  'Machine error during operation - and part inspection',
                  'Cashless device error',
                  'Nayax Error',
                  
                  'Nut fallen inside machine',
           
                  'Suspected internal leak',
        
                  'Machine error during operation',
                  'Required cleaning and part inspection',
                ].map((issue) => (
                  <label key={issue} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      value={issue}
                      checked={(formData.issues_errors || []).includes(issue)}
                      onChange={(e) => {
                        const value = e.target.value;
                        const currentIssues = Array.isArray(formData.issues_errors)
                          ? formData.issues_errors
                          : (formData.issues_errors?.split(', ') || []);
                        const newIssues = currentIssues.includes(value)
                          ? currentIssues.filter((v) => v !== value)
                          : [...currentIssues, value];
                        onUpdate({ issues_errors: newIssues.join(', ') });
                      }}
                      className="accent-red-600"
                    />
                    <span>{issue}</span>
                  </label>
                ))}
              </div>
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
                <Label>Status of Machine - Water for Cleaning *</Label>
                <Select
                  value={formData.water_cleaning_status || ''}
                  onValueChange={(value) => onUpdate({ water_cleaning_status: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0 - 20%">0 - 20%</SelectItem>
                    <SelectItem value="20 - 40%">20 - 40%</SelectItem>
                    <SelectItem value="40 - 60%">40 - 60 %</SelectItem>
                    <SelectItem value="60 - 80%">60 - 80 %</SelectItem>
                    <SelectItem value="80 - 100%">80 - 100 %</SelectItem>

                  </SelectContent>
                </Select>
              </div>


              <div className="space-y-2">
                <Label>Status of Machine - Refrigerant Water *</Label>
                <Select
                  value={formData.refrigerant_water_status || ''}
                  onValueChange={(value: string) =>
                    onUpdate({ refrigerant_water_status: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0 - 20%">0 - 20%</SelectItem>
                    <SelectItem value="20 - 40%">20 - 40%</SelectItem>
                    <SelectItem value="40 - 60%">40 - 60%</SelectItem>
                    <SelectItem value="60 - 80%">60 - 80%</SelectItem>
                    <SelectItem value="80 - 100%">80 - 100%</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Cleaning Water Select */}
                <div className="space-y-2">
                  <Label>Status of Machine - Cleaning Water *</Label>
                  <Select
                    value={formData.filled_cleaning_water || ''}
                    onValueChange={(value: string) =>
                      onUpdate({ filled_cleaning_water: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0 - 20%">0 - 20%</SelectItem>
                      <SelectItem value="20 - 40%">20 - 40%</SelectItem>
                      <SelectItem value="40 - 60%">40 - 60%</SelectItem>
                      <SelectItem value="60 - 80%">60 - 80%</SelectItem>
                      <SelectItem value="80 - 100%">80 - 100%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Refrigerant Water Select */}
                <div className="space-y-2">
                  <Label>Status of Machine - Refrigerant Water *</Label>
                  <Select
                    value={typeof formData.filled_refrigerant_water === 'string' ? formData.filled_refrigerant_water : ''}
                    onValueChange={(value: string) =>
                      onUpdate({ filled_refrigerant_water: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0 - 20%">0 - 20%</SelectItem>
                      <SelectItem value="20 - 40%">20 - 40%</SelectItem>
                      <SelectItem value="40 - 60%">40 - 60%</SelectItem>
                      <SelectItem value="60 - 80%">60 - 80%</SelectItem>
                      <SelectItem value="80 - 100%">80 - 100%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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