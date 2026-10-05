const fs = require('fs');
const content = fs.readFileSync('src/utils/exportWord.ts', 'utf8');
const lines = content.split('\n');
const starts = [];
lines.forEach((l, i) => { if (l.includes('isLegacy') || l.includes('checklist_by_equipment')) starts.push(i); });
starts.forEach(start => {
    console.log("--- MATCH ---");
    console.log(lines.slice(Math.max(0, start - 2), start + 5).join('\n'));
});
