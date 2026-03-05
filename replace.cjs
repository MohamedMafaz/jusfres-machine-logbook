const fs = require('fs');
const step2Path = 'src/components/MaintenanceForm/Step2.tsx';
const newChunkPath = 'edit_step2.txt';

const step2Content = fs.readFileSync(step2Path, 'utf8');
const newChunkContent = fs.readFileSync(newChunkPath, 'utf8');

const startMarker = "        {/* Machine Supplies */}";
const endMarker = "        {/* Submit Button */}";

const startIdx = step2Content.indexOf(startMarker);
const endIdx = step2Content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
    console.error("Markers not found.");
    process.exit(1);
}

const newContent = step2Content.substring(0, startIdx) + newChunkContent + "\n" + step2Content.substring(endIdx);
fs.writeFileSync(step2Path, newContent, 'utf8');
console.log("Updated Step2.tsx successfully.");
