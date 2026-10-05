const fs = require('fs');

const filename = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(filename, 'utf8');

// Fix the flex space-x-3 that contains dropdown and toggle
content = content.replace(/<div className="flex space-x-3">/g, '<div className="flex flex-wrap gap-3 w-full md:w-auto">');

// Make the relative wrapper for the select flexible
content = content.replace(/<div className="relative">\s*<Users/g, '<div className="relative flex-1 min-w-[200px]">\n              <Users');

// Add horizontal scrolling constraint to calendar view grid
content = content.replace(/<div className="grid grid-cols-7 gap-4">/g, '<div className="grid grid-cols-7 gap-2 md:gap-4 min-w-[800px] md:min-w-0">');

// We should also make the select width full so it fills the flex-1
content = content.replace(/className="pl-9 pr-8 py-1.5 border border-gray-300/g, 'className="w-full pl-9 pr-8 py-1.5 border border-gray-300');

fs.writeFileSync(filename, content, 'utf8');
console.log('Fixed ShiftSchedule calendar view and flex wrap');
