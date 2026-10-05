const fs = require('fs');
const content = fs.readFileSync('src/components/devices/MeasurementSessionModal.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('BẢNG 1') || l.includes('NỘI DUNG KIỂM TRA CHUNG') || l.includes('N.I DUNG KI.M TRA CHUNG'));
if(start !== -1) {
    console.log(lines.slice(start - 2, start + 40).join('\n'));
} else {
    console.log("Not found.");
}
