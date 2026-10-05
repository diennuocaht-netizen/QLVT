const fs = require('fs');
const content = fs.readFileSync('src/utils/exportWord.ts', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('checklist_by_equipment'));
if (start !== -1) {
    console.log(lines.slice(Math.max(0, start - 5), start + 35).join('\n'));
} else {
    console.log("Not found.");
}
