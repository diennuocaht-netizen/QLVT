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
    content = content.replace(/className="flex-1 relative"/g, 'className="flex-1 relative min-w-[200px]"');
    fs.writeFileSync(filename, content, 'utf8');
  }
});

console.log('Added min-w to search boxes');
