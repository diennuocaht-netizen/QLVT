const fs = require('fs');
const content = fs.readFileSync('src/components/devices/MeasurementSessionModal.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('BẢNG 2') || l.includes('B.NG 2'));
if (start !== -1) {
    console.log(lines.slice(start - 2, start + 30).join('\n'));
} else {
    console.log("Not found.");
}
