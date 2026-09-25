const fs = require('fs');
const file = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(file, 'utf8');

// Header replacement
const targetHeader = `{days.map(d => (
                      <th key={d.dateStr} className={\`border border-gray-300 p-1 text-center min-w-[32px] 
\${d.dayOfWeek === 0 || d.dayOfWeek === 6 ? 'bg-orange-50' : 'bg-gray-50'}\`}>`;

const replaceHeader = `{days.map(d => {
                      const isToday = isCurrentMonth && d.dayNum === today.getDate();
                      return (
                      <th key={d.dateStr} className={\`border border-gray-300 p-1 text-center min-w-[32px] 
\${isToday ? 'bg-blue-100 text-blue-900 border-blue-500 border-x-2 font-bold' : d.dayOfWeek === 0 || d.dayOfWeek === 6 ? 'bg-orange-50' : 'bg-gray-50'}\`}>`;

content = content.replace(
  "{days.map(d => (\n                      <th key={d.dateStr} className={`border border-gray-300 p-1 text-center min-w-[32px] \n${d.dayOfWeek === 0 || d.dayOfWeek === 6 ? 'bg-orange-50' : 'bg-gray-50'}`}>",
  "{days.map(d => {\n                      const isToday = isCurrentMonth && d.dayNum === today.getDate();\n                      return (\n                      <th key={d.dateStr} className={`border border-gray-300 p-1 text-center min-w-[32px] \n${isToday ? 'bg-blue-100 text-blue-900 border-blue-500 border-x-2 z-10 relative font-bold shadow-[0_0_5px_rgba(59,130,246,0.3)]' : d.dayOfWeek === 0 || d.dayOfWeek === 6 ? 'bg-orange-50' : 'bg-gray-50'}`}>"
);

// We need to add the closing parenthesis for the new return statement in header!
// Let's replace the inner structure of header
content = content.replace(
  `<div className="text-[10px] text-gray-500">{getDayLabel(d.dayOfWeek)}</div>
                        <div className={\`font-bold \${d.dayOfWeek === 0 ? 'text-red-500' : ''}\`}>{d.dayNum}</div>
                      </th>
                    ))}
                    <th className="border border-gray-300 p-2 text-center bg-gray-100 w-12 text-xs">Nghỉ OFF</th>`,
  `<div className="text-[10px] text-gray-500">{getDayLabel(d.dayOfWeek)}</div>
                        <div className={\`font-bold \${d.dayOfWeek === 0 ? 'text-red-500' : ''}\`}>{d.dayNum}</div>
                      </th>
                      );
                    })}
                    <th className="border border-gray-300 p-2 text-center bg-gray-100 w-12 text-xs">Nghỉ OFF</th>`
);

// Body replacement
content = content.replace(
  `{days.map(d => {
                            const sId = getShiftValue(emp.id, d.dateStr);
                            const sType = shiftTypes.find(t => t.id === sId);
                            
                            return (
                              <td key={d.dateStr} className="border border-gray-300 p-0 text-center relative group">`,
  `{days.map(d => {
                            const sId = getShiftValue(emp.id, d.dateStr);
                            const sType = shiftTypes.find(t => t.id === sId);
                            const isToday = isCurrentMonth && d.dayNum === today.getDate();
                            
                            return (
                              <td key={d.dateStr} className={\`border border-gray-300 p-0 text-center relative group \${isToday ? 'bg-blue-50 border-blue-500 border-x-2 relative z-0' : ''}\`}>`
);

fs.writeFileSync(file, content, 'utf8');
console.log('OK');
