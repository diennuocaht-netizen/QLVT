const fs = require('fs');
const file = 'src/components/projects/ProjectGanttChart.tsx';
let content = fs.readFileSync(file, 'utf8');

// The backslashes were incorrectly inserted
content = content.replace(/\\`/g, '`');
content = content.replace(/\\\$/g, '$');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed escaping in ProjectGanttChart.tsx');
