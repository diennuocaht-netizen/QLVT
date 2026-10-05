const fs = require('fs');

const files = [
  'src/pages/HRTasks.tsx',
  'src/pages/HRTaskLog.tsx',
  'src/pages/HREvents.tsx',
  'src/pages/ShiftSchedule.tsx'
];

files.forEach(filename => {
  if (fs.existsSync(filename)) {
    let content = fs.readFileSync(filename, 'utf8');

    // Remove labels
    content = content.replace(/<label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">.*?<\/label>\s*/g, '');
    
    // Adjust container paddings
    content = content.replace(/p-4 shrink-0/g, 'p-2 md:p-4 shrink-0');
    
    // Adjust flex container
    content = content.replace(/className="flex flex-col md:flex-row gap-4 items-end"/g, 'className="flex flex-wrap gap-2 md:gap-4 items-center"');
    
    // For HRTaskLog specifically
    content = content.replace(/flex flex-wrap gap-4 items-end/g, 'flex flex-wrap gap-2 md:gap-4 items-center');

    // Make inputs smaller on mobile and take available width if possible
    content = content.replace(/py-2/g, 'py-1.5 md:py-2 text-sm');
    
    // Make date/shift inputs flexible or smaller on mobile
    content = content.replace(/w-40/g, 'w-36 md:w-40');
    content = content.replace(/w-48/g, 'w-40 md:w-48');

    fs.writeFileSync(filename, content, 'utf8');
  }
});

console.log('Stripped labels and compacted search bars');
