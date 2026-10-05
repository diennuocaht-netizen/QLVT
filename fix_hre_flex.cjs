const fs = require('fs');

const filename = 'src/pages/HREvents.tsx';
let content = fs.readFileSync(filename, 'utf8');

content = content.replace(/className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"/g, 'className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 md:p-4 shrink-0"');
content = content.replace(/className="flex flex-col md:flex-row gap-4 mb-6"/g, 'className="flex flex-wrap gap-2 md:gap-4 mb-4 md:mb-6"');

fs.writeFileSync(filename, content, 'utf8');
console.log('Fixed HREvents.tsx flex');
