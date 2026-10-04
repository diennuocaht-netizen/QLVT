const fs = require('fs');
const content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
const lines = content.split('\n');

const idx1 = lines.findIndex(l => l.includes('const fetchStats'));
console.log('--- fetchStats ---');
console.log(lines.slice(idx1, idx1 + 20).join('\n'));

const idx2 = lines.findIndex(l => l.includes('Fetch Ongoing Events'));
console.log('--- Fetch Ongoing Events ---');
console.log(lines.slice(idx2, idx2 + 20).join('\n'));
