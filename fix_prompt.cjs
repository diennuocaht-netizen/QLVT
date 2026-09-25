const fs = require('fs');
const file = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove truncation logic
content = content.replace(
  /if \(listStr\.length > 300\) \{[\s\S]*?\}/,
  `// Removed truncation to allow showing all sheets`
);

fs.writeFileSync(file, content, 'utf8');
console.log('OK');
