const fs = require('fs');
const file = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(file, 'utf8');

// Find the section
const search = `{days.map(d => (`;
const idx = content.indexOf(search);
if (idx > -1) {
  const endSearch = `))}
                    <th`;
  const endIdx = content.indexOf(endSearch, idx);
  
  if (endIdx > -1) {
    const originalBlock = content.substring(idx, endIdx + 3); // include ))}
    const replacementBlock = `{days.map(d => {
                      const isToday = isCurrentMonth && d.dayNum === today.getDate();
                      return (
                      <th key={d.dateStr} className={\`border border-gray-300 p-1 text-center min-w-[32px] \${isToday ? 'bg-blue-100 text-blue-900 border-blue-500 border-x-2 border-y-2 z-10 relative shadow-sm' : d.dayOfWeek === 0 || d.dayOfWeek === 6 ? 'bg-orange-50' : 'bg-gray-50'}\`}>
                        <div className="text-[10px] text-gray-500">{getDayLabel(d.dayOfWeek)}</div>
                        <div className={\`font-bold \${d.dayOfWeek === 0 ? 'text-red-500' : ''}\`}>{d.dayNum}</div>
                      </th>
                      );
                    })}`;
    content = content.replace(originalBlock, replacementBlock);
    fs.writeFileSync(file, content, 'utf8');
    console.log('REPLACED HEADER');
  }
}
