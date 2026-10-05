const fs = require('fs');
const content = fs.readFileSync('src/pages/MeasurementForms.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('itemLabelHeader'));
if(start !== -1) {
    console.log(lines.slice(Math.max(0, start - 5), start + 20).join('\n'));
} else {
    console.log("Not found.");
}
