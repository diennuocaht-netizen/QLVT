const fs = require('fs');
const file = 'src/components/hr/TaskTimelineModal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\\`/g, '`');
fs.writeFileSync(file, content, 'utf8');
