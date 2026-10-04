const fs = require('fs');
const content = fs.readFileSync('src/pages/HREvents.tsx', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('start_time') || l.includes('end_time'));
if (idx >= 0) {
    console.log(lines.slice(idx, idx + 10).join('\n'));
} else {
    console.log('Not found');
}
