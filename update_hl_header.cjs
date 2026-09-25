const fs = require('fs');
const file = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(file, 'utf8');

const headerTarget = `{days.map(d => (
                      <th key={d.dateStr} className={\`border border-gray-300 p-1 text-center min-w-[32px] 
\${d.dayOfWeek === 0 || d.dayOfWeek === 6 ? 'bg-orange-50' : 'bg-gray-50'}\`}>
                        <div className="text-[10px] text-gray-500">{getDayLabel(d.dayOfWeek)}</div>
                        <div className={\`font-bold \${d.dayOfWeek === 0 ? 'text-red-500' : ''}\`}>{d.dayNum}</div>
                      </th>
                    ))}`;

const headerReplacement = `{days.map(d => {
                      const isToday = isCurrentMonth && d.dayNum === today.getDate();
                      return (
                      <th key={d.dateStr} className={\`border border-gray-300 p-1 text-center min-w-[32px] 
\${isToday ? 'bg-blue-100 text-blue-900 border-blue-500 border-x-2 z-10 relative font-bold shadow-[0_0_5px_rgba(59,130,246,0.3)]' : d.dayOfWeek === 0 || d.dayOfWeek === 6 ? 'bg-orange-50' : 'bg-gray-50'}\`}>
                        <div className="text-[10px] text-gray-500">{getDayLabel(d.dayOfWeek)}</div>
                        <div className={\`font-bold \${d.dayOfWeek === 0 ? 'text-red-500' : ''}\`}>{d.dayNum}</div>
                      </th>
                      );
                    })}`;

content = content.replace(headerTarget, headerReplacement);
fs.writeFileSync(file, content, 'utf8');
console.log('OK');
