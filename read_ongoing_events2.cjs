const fs = require('fs');
const content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('setOngoingEvents(events)'));
if (idx >= 0) {
    console.log(lines.slice(idx - 15, idx + 10).join('\n'));
} else {
    console.log('Not found');
}
