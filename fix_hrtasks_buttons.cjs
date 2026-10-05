const fs = require('fs');
const filename = 'src/pages/HRTasks.tsx';
let content = fs.readFileSync(filename, 'utf8');

content = content.replace(
  /C\?u hnh\s+<\/button>/g,
  '<span className="hidden sm:inline">Cấu hình</span></button>'
);

content = content.replace(
  /Checklist\s+<\/button>/g,
  '<span className="hidden sm:inline">Checklist</span></button>'
);

content = content.replace(
  /T\?o cng vi\?c\s+<\/button>/g,
  'Tạo việc</button>'
);

// adjust padding on the buttons
content = content.replace(/px-3 py-1.5 text-sm/g, 'px-2 md:px-3 py-1.5 text-xs md:text-sm');

fs.writeFileSync(filename, content, 'utf8');
console.log('Fixed HRTasks.tsx buttons');
