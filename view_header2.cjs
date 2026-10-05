const fs = require('fs');
const lines = fs.readFileSync('src/pages/ShiftSchedule.tsx', 'utf8').split('\n');
const start = lines.findIndex(l => l.includes('</button>'));
const nextPart = lines.findIndex((l, i) => i > start && l.includes('<div className="flex bg-gray-100'));
console.log(lines.slice(nextPart - 5, nextPart + 50).join('\n'));
