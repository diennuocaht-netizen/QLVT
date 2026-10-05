const fs = require('fs');

const filename = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(filename, 'utf8');

content = content.replace(/w-24 min-w-\[6rem\]/g, 'w-32 min-w-[8rem]');

fs.writeFileSync(filename, content, 'utf8');
console.log('Fixed width');
