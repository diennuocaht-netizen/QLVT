const fs = require('fs');
const content = fs.readFileSync('src/components/devices/MeasurementSessionModal.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('Thiết bị/Máy móc cần kiểm tra') || l.includes('Thi.t b./Máy móc c.n ki.m tra'));

if(start !== -1) {
    console.log(lines.slice(start - 10, start + 30).join('\n'));
} else {
    console.log("Not found.");
}
