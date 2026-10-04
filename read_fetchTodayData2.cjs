const fs = require('fs');
const content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('fetchTodayData = async'));
if (idx >= 0) {
    console.log(lines.slice(idx + 40, idx + 80).join('\n'));
} else {
    console.log('Not found');
}
