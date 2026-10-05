const fs = require('fs');
const filename = 'src/pages/HRTasks.tsx';
let content = fs.readFileSync(filename, 'utf8');

content = content.replace(/<Settings size={18} \/>/g, '<Settings size={16} />');
content = content.replace(/<FileText size={18} \/>/g, '<FileText size={16} />');
content = content.replace(/<Plus size={18} \/>/g, '<Plus size={16} />');

fs.writeFileSync(filename, content, 'utf8');
console.log('Fixed icon sizes');
