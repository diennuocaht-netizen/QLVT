const fs = require('fs');
const content = fs.readFileSync('src/pages/HREvents.tsx', 'utf8');
const lines = content.split('\n');
const statuses = new Set();
lines.forEach(l => {
    const match = l.match(/status[:=]\s*['"]([^'"]+)['"]/);
    if (match) statuses.add(match[1]);
});
console.log("Found statuses:", Array.from(statuses));
