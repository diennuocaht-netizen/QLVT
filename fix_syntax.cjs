const fs = require('fs');

const files = [
  'src/pages/ShiftSchedule.tsx',
  'src/pages/HRTasks.tsx',
  'src/pages/HRTaskLog.tsx',
  'src/pages/HREvents.tsx'
];

files.forEach(filename => {
  if (fs.existsSync(filename)) {
    let content = fs.readFileSync(filename, 'utf8');
    content = content.replace(/s\*<div className="flex-1 w-full md:w-auto">s\*<h1/g, '\n          <div className="flex-1 w-full md:w-auto">\n            <h1');
    fs.writeFileSync(filename, content, 'utf8');
  }
});

console.log('Fixed syntax error');
