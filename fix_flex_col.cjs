const fs = require('fs');

function forceFlexCol(filename) {
  let content = fs.readFileSync(filename, 'utf8');
  content = content.replace(
    /<div className="flex justify-between items-center mb-6">/g,
    '<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4 md:mb-6">'
  );
  content = content.replace(
    /<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4 md:mb-6">\s*<div>\s*<h1/g,
    '<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4 md:mb-6">\s*<div className="flex-1 w-full md:w-auto">\s*<h1'
  );
  
  // ShiftSchedule right side
  content = content.replace(
    /<div className="flex space-x-3">/g,
    '<div className="flex flex-wrap gap-2">'
  );
  
  fs.writeFileSync(filename, content, 'utf8');
}

forceFlexCol('src/pages/ShiftSchedule.tsx');
forceFlexCol('src/pages/HRTasks.tsx');
forceFlexCol('src/pages/HRTaskLog.tsx');
forceFlexCol('src/pages/HREvents.tsx');
console.log('Fixed flex col');
