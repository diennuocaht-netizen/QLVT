const fs = require('fs');
const content = fs.readFileSync('src/components/devices/MeasurementSessionModal.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('const handleSubmit ='));
if (start !== -1) {
    console.log(lines.slice(start, start + 30).join('\n'));
} else {
    console.log("Not found.");
}
