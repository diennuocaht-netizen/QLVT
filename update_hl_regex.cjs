const fs = require('fs');
const file = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(file, 'utf8');

// Header
content = content.replace(
  /\{days\.map\(d => \(\s*<th key=\{d\.dateStr\} className=\{\`border border-gray-300 p-1 text-center min-w-\[32px\]\s*\$\{d\.dayOfWeek === 0 \|\| d\.dayOfWeek === 6 \? 'bg-orange-50' : 'bg-gray-50'\}\`\}>\s*<div className="text-\[10px\] text-gray-500">\{getDayLabel\(d\.dayOfWeek\)\}<\/div>\s*<div className=\{\`font-bold \$\{d\.dayOfWeek === 0 \? 'text-red-500' : ''\}\`\}>\{d\.dayNum\}<\/div>\s*<\/th>\s*\)\}/g,
  `{days.map(d => {
                      const isToday = isCurrentMonth && d.dayNum === today.getDate();
                      return (
                      <th key={d.dateStr} className={\`border border-gray-300 p-1 text-center min-w-[32px] 
\${isToday ? 'bg-blue-100 text-blue-900 border-blue-500 border-x-2 z-10 relative font-bold shadow-[0_0_5px_rgba(59,130,246,0.3)]' : d.dayOfWeek === 0 || d.dayOfWeek === 6 ? 'bg-orange-50' : 'bg-gray-50'}\`}>
                        <div className="text-[10px] text-gray-500">{getDayLabel(d.dayOfWeek)}</div>
                        <div className={\`font-bold \${d.dayOfWeek === 0 ? 'text-red-500' : ''}\`}>{d.dayNum}</div>
                      </th>
                      );
                    })}`
);

// Body
content = content.replace(
  /\{days\.map\(d => \{\s*const sId = getShiftValue\(emp\.id, d\.dateStr\);\s*const sType = shiftTypes\.find\(t => t\.id === sId\);\s*return \(\s*<td key=\{d\.dateStr\} className="border border-gray-300 p-0 text-center relative group">/g,
  `{days.map(d => {
                            const sId = getShiftValue(emp.id, d.dateStr);
                            const sType = shiftTypes.find(t => t.id === sId);
                            const isToday = isCurrentMonth && d.dayNum === today.getDate();
                            
                            return (
                              <td key={d.dateStr} className={\`border border-gray-300 p-0 text-center relative group \${isToday ? 'bg-blue-50 border-blue-500 border-x-2 relative z-0' : ''}\`}>`
);

fs.writeFileSync(file, content, 'utf8');
console.log('OK');
