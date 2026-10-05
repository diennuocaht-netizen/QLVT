const fs = require('fs');
const content = fs.readFileSync('src/pages/MeasurementForms.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('Cấu hình cột') || l.includes('C.u hình c.t'));
if(start !== -1) {
    console.log(lines.slice(Math.max(0, start - 2), start + 25).join('\n'));
} else {
    console.log("Not found.");
}
