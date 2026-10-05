const fs = require('fs');
const content = fs.readFileSync('src/utils/exportWord.ts', 'utf8');
const lines = content.split('\n');
const start = lines.findIndex(l => l.includes('Table(') && lines.slice(start, start+50).join('\\n').includes('checklist_by_equipment'));
// Wait, better to find 'checklistByEq' or similar mapping
const match = lines.findIndex((l, i) => i > 50 && l.includes('checklist_by_equipment'));
if(match !== -1) {
  console.log(lines.slice(Math.max(0, match - 10), match + 40).join('\n'));
}
