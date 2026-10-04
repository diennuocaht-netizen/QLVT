const fs = require('fs');
const content = fs.readFileSync('src/pages/HREvents.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('Sắp diễn ra'));
if (start >= 0) {
    console.log(lines.slice(Math.max(0, start - 15), start + 15).join('\n'));
} else {
    console.log('Not found');
}
