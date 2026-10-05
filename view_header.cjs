const fs = require('fs');
const lines = fs.readFileSync('src/pages/ShiftSchedule.tsx', 'utf8').split('\n');
const start = lines.findIndex(l => l.includes('<div className="flex justify-between items-center mb-6">'));
console.log(lines.slice(start, start + 60).join('\n'));
