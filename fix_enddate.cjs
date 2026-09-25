const fs = require('fs');
const file = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `const endDate = new Date(year, month, 0).toISOString().split('T')[0];`;
const replacement = `const lastDay = new Date(year, month, 0).getDate();
          const endDate = \`\${year}-\${month.toString().padStart(2, '0')}-\${lastDay.toString().padStart(2, '0')}\`;`;

content = content.replace(target, replacement);

fs.writeFileSync(file, content, 'utf8');
console.log('FIXED ENDDATE');
