const fs = require('fs');
const file = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetClass = `className={\`border border-gray-300 p-1 text-center min-w-[32px] 
\${d.dayOfWeek === 0 || d.dayOfWeek === 6 ? 'bg-orange-50' : 'bg-gray-50'}\`}`;

const replacementClass = `className={\`border border-gray-300 p-1 text-center min-w-[32px] 
\${isToday ? 'bg-blue-100 text-blue-900 border-blue-500 border-x-2 z-10 relative shadow-[inset_0_-2px_0_0_#3b82f6]' : d.dayOfWeek === 0 || d.dayOfWeek === 6 ? 'bg-orange-50' : 'bg-gray-50'}\`}`;

content = content.replace(targetClass, replacementClass);
fs.writeFileSync(file, content, 'utf8');
console.log('REPLACED CLASS');
