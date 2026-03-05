import re

filepath = r"src/components/MaintenanceForm/Step2.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Add Tabs and icons imports
content = content.replace("import { Switch } from '@/components/ui/switch';", "import { Switch } from '@/components/ui/switch';\nimport { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';")
content = content.replace("CheckCircle, Coffee, Thermometer, Droplets, Wrench } from 'lucide-react';", "CheckCircle, Coffee, Thermometer, Droplets, Wrench, Citrus, Apple } from 'lucide-react';")

# Find the start of Machine Supplies and the end of Water Systems
start_marker = "{/* Machine Supplies */}"
end_marker = "        {/* Submit Button */}"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    print("Markers not found!")
    exit(1)

original_machine_sections = content[start_idx:end_idx]

# Replace some strings in the new apple section to point to apple_ variables instead of orange variables
apple_machine_sections = original_machine_sections \
    .replace('cup_availability', 'apple_cup_availability') \
    .replace('lid_availability', 'apple_lid_availability') \
    .replace('oranges_placed', 'apples_placed') \
    .replace('Number of Oranges Placed', 'Number of Apples Placed') \
    .replace('orange_refill', 'apple_refill') \
    .replace('Orange Refill Count', 'Apple Refill Count') \
    .replace('temperature', 'apple_temperature') \
    .replace('tasks_completed', 'apple_tasks_completed') \
    .replace('issues_errors', 'apple_issues_errors') \
    .replace('water_cleaning_status', 'apple_water_cleaning_status') \
    .replace('refrigerant_water_status', 'apple_refrigerant_water_status') \
    .replace('filled_cleaning_water', 'apple_filled_cleaning_water') \
    .replace('filled_refrigerant_water', 'apple_filled_refrigerant_water')

# Note: The original already had an apples_placed section and an apple_refill section inside it.
# So apple_machine_sections will have "apples_placed" but also another "apples_placed".
# Wait, this regex approach might duplicate things incorrectly.

# It's better to provide exactly what we want.
