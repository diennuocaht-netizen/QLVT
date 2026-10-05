const fs = require('fs');
const filename = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(filename, 'utf8');

content = content.replace(/<div className="flex space-x-2 text-xs">/g, '<div className="hidden md:flex flex-wrap gap-2 text-xs">');

fs.writeFileSync(filename, content, 'utf8');
console.log('Fixed shift legend wrapper');
