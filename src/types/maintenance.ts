export interface MaintenanceEntry {
  id?: string;
  filled_by: string;
  date_of_entry: string;
  current_step: number;
  step1_completed: boolean;
  step2_completed: boolean;
  step3_completed: boolean;

  // Step 1 fields
  start_location?: string;
  start_time?: string;
  odometer_start?: number;
  battery_start?: number;
  items_carried?: string;

  // Orange Box Counts
  orange_88_count?: number;
  orange_113_count?: number;
  orange_custom_box_count?: number;
  orange_custom_count_per_box?: number;

  // Apple Box Counts
  apple_88_count?: number;
  apple_113_count?: number;
  apple_custom_box_count?: number;
  apple_custom_count_per_box?: number;

  // Step 2 fields
  end_location?: string;
  end_time?: string;
  odometer_end?: number;
  battery_end?: number;
  oranges_placed?: number;
  apples_placed?: number;

  // Step 3 fields (Merged into Step 2)
  cup_availability?: number;
  lid_availability?: number;
  lid_availability_type?: string;
  tasks_completed?: string;
  issues_errors?: string;
  orange_refill?: number;
  orange_refill_type?: string;
  orange_refill_tasks?: string[];
  temperature?: number;
  refrigerant_water_status?: string;
  water_cleaning_status?: string;
  filled_cleaning_water?: boolean;
  filled_refrigerant_water?: boolean;

  // Calculated fields
  distance?: number;
  duration_minutes?: number;

  // Timestamps
  created_at?: string;
  updated_at?: string;
  step1_completed_at?: string;
  step2_completed_at?: string;
  step3_completed_at?: string;
}

export interface User {
  username: string;
  password: string;
  displayName: string;
}

export interface NotificationData {
  id: string;
  user: string;
  step: number;
  entryId: string;
  message: string;
  timestamp: string;
  type: string;
}