const fs = require('fs');
const file = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  `                            <div key={st.id} className="text-[10px] leading-tight flex items-start">
                              <span className="font-bold min-w-[20px] shrink-0" style={{ color: st.text_color }}>{st.code}:</span>
                              <span className="text-gray-600 ml-1">{emps.join(', ')}</span>
                            </div>`,
  `                            <div key={st.id} className="text-sm py-0.5 leading-relaxed flex items-start whitespace-normal">
                              <span className="font-bold text-[15px] min-w-[24px] shrink-0" style={{ color: st.text_color }}>{st.code}:</span>
                              <span className="text-gray-800 font-medium ml-1 flex-1">{emps.join(', ')}</span>
                            </div>`
);

fs.writeFileSync(file, content, 'utf8');
console.log('OK');
