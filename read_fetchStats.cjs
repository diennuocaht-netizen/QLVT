const fs = require('fs');
const content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('const fetchStats = async'));
if (idx >= 0) {
    console.log(lines.slice(idx, idx + 40).join('\n'));
} else {
    console.log('Not found');
}
