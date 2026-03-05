const fs = require('fs');

let content = fs.readFileSync('src/components/MaintenanceDetailsDialog.tsx', 'utf-8');

// Update Temp to show Orange & Apple
content = content.replace(
  `{entry.temperature ? \`\${entry.temperature}°C\` : '-'}</p>`,
  `{entry.temperature ? \`\${entry.temperature}°C\` : '-'}</p>
                    {entry.apple_temperature != null && (
                      <p className="font-bold text-red-700 dark:text-red-300 text-[10px] mt-1">Apple: {entry.apple_temperature}°C</p>
                    )}`
);

// Update Apple Inventory section to show customs per box
content = content.replace(
  `<div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">Custom Boxes (A)</p>
                  <p className="text-lg font-medium">{entry.apple_custom_box_count ?? '-'}</p>
                </div>`,
  `<div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">Custom Boxes (A)</p>
                  <p className="text-lg font-medium">{entry.apple_custom_box_count ?? '-'}</p>
                </div>
                <div className="p-3 border rounded-lg bg-muted/30">
                  <p className="text-[10px] text-muted-foreground uppercase mb-1">Custom Count/Box</p>
                  <p className="text-lg font-medium">{entry.apple_custom_count_per_box ?? '-'}</p>
                </div>`
);

// Update Water Systems
content = content.replace(
  `<span className="text-muted-foreground">Cleaning Water Status</span>
                    <span className="font-semibold">{entry.water_cleaning_status || '-'}</span>`,
  `<span className="text-muted-foreground">Cleaning Water Status</span>
                    <div className="text-right">
                      <div className="font-semibold text-orange-600">O: {entry.water_cleaning_status || '-'}</div>
                      <div className="font-semibold text-red-600">A: {entry.apple_water_cleaning_status || '-'}</div>
                    </div>`
);

content = content.replace(
  `<span className="text-muted-foreground">Refrigerant Water Status</span>
                    <span className="font-semibold">{entry.refrigerant_water_status || '-'}</span>`,
  `<span className="text-muted-foreground">Refrigerant Water Status</span>
                    <div className="text-right">
                      <div className="font-semibold text-orange-600">O: {entry.refrigerant_water_status || '-'}</div>
                      <div className="font-semibold text-red-600">A: {entry.apple_refrigerant_water_status || '-'}</div>
                    </div>`
);

content = content.replace(
  `<span className="text-[10px] text-muted-foreground uppercase">Refilled Cln.</span>
                      <Badge variant={entry.filled_cleaning_water ? "default" : "outline"}>
                        {entry.filled_cleaning_water ? 'Yes' : 'No'}
                      </Badge>`,
  `<span className="text-[10px] text-muted-foreground uppercase">Refilled Cln.</span>
                      <div className="flex flex-col gap-1 items-end">
                        <Badge variant={entry.filled_cleaning_water ? "default" : "outline"} className="text-[10px] h-4">O: {entry.filled_cleaning_water ? 'Yes' : 'No'}</Badge>
                        <Badge variant={entry.apple_filled_cleaning_water ? "destructive" : "outline"} className="text-[10px] h-4">A: {entry.apple_filled_cleaning_water ? 'Yes' : 'No'}</Badge>
                      </div>`
);

content = content.replace(
  `<span className="text-[10px] text-muted-foreground uppercase">Refilled Ref.</span>
                      <Badge variant={entry.filled_refrigerant_water ? "default" : "outline"}>
                        {entry.filled_refrigerant_water ? 'Yes' : 'No'}
                      </Badge>`,
  `<span className="text-[10px] text-muted-foreground uppercase">Refilled Ref.</span>
                      <div className="flex flex-col gap-1 items-end">
                        <Badge variant={entry.filled_refrigerant_water ? "default" : "outline"} className="text-[10px] h-4">O: {entry.filled_refrigerant_water ? 'Yes' : 'No'}</Badge>
                        <Badge variant={entry.apple_filled_refrigerant_water ? "destructive" : "outline"} className="text-[10px] h-4">A: {entry.apple_filled_refrigerant_water ? 'Yes' : 'No'}</Badge>
                      </div>`
);

// Update Tasks & Issues
content = content.replace(
  `{entry.tasks_completed || 'No specific tasks documented.'}`,
  `{entry.tasks_completed && <div><span className="font-bold text-orange-700">Orange:</span> {entry.tasks_completed}</div>}
                   {entry.apple_tasks_completed && <div><span className="font-bold text-red-700">Apple:</span> {entry.apple_tasks_completed}</div>}
                   {!entry.tasks_completed && !entry.apple_tasks_completed && 'No specific tasks documented.'}`
);

content = content.replace(
  `{entry.issues_errors}`,
  `{entry.issues_errors && <div><span className="font-bold text-orange-800">Orange:</span> {entry.issues_errors}</div>}
                     {entry.apple_issues_errors && <div className="mt-1"><span className="font-bold text-red-800">Apple:</span> {entry.apple_issues_errors}</div>}`
);

// It replaces the 2nd instance appropriately for issues too if we do string match on '{entry.issues_errors}' but we have to be careful it doesn't replace something else.
// There's only one `{entry.issues_errors}` inside the JSX render tree.

// Update Supplies
content = content.replace(
  `<p className="font-medium">{entry.cup_availability ?? '-'} Reels</p>`,
  `<p className="font-medium text-orange-600 text-xs">O: {entry.cup_availability ?? '-'} Reels</p>
                     <p className="font-medium text-red-600 text-xs">A: {entry.apple_cup_availability ?? '-'} Reels</p>`
);
content = content.replace(
  `<p className="font-medium">{entry.lid_availability ?? '-'} Reels</p>`,
  `<p className="font-medium text-orange-600 text-xs">O: {entry.lid_availability ?? '-'} Reels</p>
                     <p className="font-medium text-red-600 text-xs">A: {entry.apple_lid_availability ?? '-'} Reels</p>`
);

// If there's an issue with the issues_errors replacement being too broad:
content = content.replace(
  `{entry.issues_errors && (
                <div className="space-y-2">`,
  `{(entry.issues_errors || entry.apple_issues_errors) && (
                <div className="space-y-2">`
);

fs.writeFileSync('src/components/MaintenanceDetailsDialog.tsx', content, 'utf-8');
console.log('Done!');
