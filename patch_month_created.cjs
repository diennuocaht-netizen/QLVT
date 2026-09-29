const fs = require('fs');
const file = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    'const isMonthCreated = hasDataThisMonth || monthCreatedState[monthKey];',
    'const isMonthCreated = hasDataThisMonth || monthCreatedState[monthKey] || isCurrentMonth;'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Patched isMonthCreated logic');
