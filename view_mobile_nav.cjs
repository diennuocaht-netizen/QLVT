const fs = require('fs');
const content = fs.readFileSync('src/components/Layout.tsx', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('bottom-0 w-full'));
console.log(lines.slice(Math.max(0, start - 5), start + 40).join('\n'));
