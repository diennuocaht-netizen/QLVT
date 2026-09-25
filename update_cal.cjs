const fs = require('fs');
const file = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `                            <div key={st.id} className="text-xs truncate">
                              <span className="font-semibold" style={{ color: st.text_color }}>{st.code}:</span> {emps.join(', ')}
                            </div>`,
  `                            <div key={st.id} className="text-[14px] font-medium py-1 whitespace-normal leading-relaxed">
                              <span className="font-bold text-[16px]" style={{ color: st.text_color }}>{st.code}:</span> {emps.join(', ')}
                            </div>`
);

fs.writeFileSync(file, content, 'utf8');
console.log('OK');
