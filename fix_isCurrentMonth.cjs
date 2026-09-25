const fs = require('fs');
const file = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Revert the bad placement
content = content.replace(
  `            // Loop through all days in month
            const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year;
            for (let day = 1; day <= daysInMonth; day++) {`,
  `            // Loop through all days in month
            const daysInMonth = new Date(year, month, 0).getDate();
            for (let day = 1; day <= daysInMonth; day++) {`
);

// 2. Put it in the correct place, inside ShiftSchedule component body, before the return statement.
// We can put it right below `const days = useMemo(() => getDaysInMonth(), [currentDate]);`
content = content.replace(
  `  const days = useMemo(() => getDaysInMonth(), [currentDate]);`,
  `  const days = useMemo(() => getDaysInMonth(), [currentDate]);
  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();`
);

fs.writeFileSync(file, content, 'utf8');
console.log('OK');
