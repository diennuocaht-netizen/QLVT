const fs = require('fs');
const content = fs.readFileSync('src/utils/exportWord.ts', 'utf8');
const lines = content.split('\n');
const match = lines.findIndex((l, i) => i > 150 && l.includes('eqColsCount'));
if(match !== -1) {
  console.log(lines.slice(Math.max(0, match - 20), match + 60).join('\n'));
}
