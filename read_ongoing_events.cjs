const fs = require('fs');
const content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('const ongoingEvents'));
if (idx >= 0) {
    console.log(lines.slice(Math.max(0, idx - 10), idx + 20).join('\n'));
} else {
    console.log('Not found');
}
