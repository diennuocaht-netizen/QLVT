const fs = require('fs');
const file = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/employees\.map\(\(emp, idx\)/g, 'filteredEmployees.map((emp, idx)');

fs.writeFileSync(file, content, 'utf8');
console.log('OK');
