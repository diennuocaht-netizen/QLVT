const fs = require('fs');

const filename = 'src/pages/HRTaskLog.tsx';
let content = fs.readFileSync(filename, 'utf8');
content = content.replace(/<div className="w-64">/g, '<div className="flex-1 min-w-[200px]">');
fs.writeFileSync(filename, content, 'utf8');
console.log('Fixed w-64 in HRTaskLog');
