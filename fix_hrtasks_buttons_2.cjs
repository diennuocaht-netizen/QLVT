const fs = require('fs');
const filename = 'src/pages/HRTasks.tsx';
let content = fs.readFileSync(filename, 'utf8');

content = content.replace(
  /C\?u hnh\s+<\/button>/g,
  '<span className="hidden sm:inline">C?u hnh</span></button>'
);

content = content.replace(
  /T\?o cng vi\?c\s+<\/button>/g,
  '<span className="hidden sm:inline">T?o cng vi?c</span><span className="sm:hidden">T?o m?i</span></button>'
);

fs.writeFileSync(filename, content, 'utf8');
console.log('Fixed HRTasks.tsx again');
