const fs = require('fs');
const file = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `{days.map(d => (
                      <th key={d.dateStr}`;

const replacement = `{days.map(d => {
                      const isToday = isCurrentMonth && d.dayNum === today.getDate();
                      return (
                      <th key={d.dateStr}`;

content = content.replace(target, replacement);

const targetEnd = `</div>
                      </th>
                    ))}`;

const replacementEnd = `</div>
                      </th>
                      );
                    })}`;
                    
content = content.replace(targetEnd, replacementEnd);
fs.writeFileSync(file, content, 'utf8');
console.log('REPLACED HEADER 2');
