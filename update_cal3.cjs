const fs = require('fs');
const file = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `                            <div key={st.id} className="text-sm py-0.5 leading-relaxed flex items-start whitespace-normal">
                              <span className="font-bold text-[15px] min-w-[24px] shrink-0" style={{ color: st.text_color }}>{st.code}:</span>
                              <span className="text-gray-800 font-medium ml-1 flex-1">{emps.join(', ')}</span>
                            </div>`;

const replacement = `                            <div key={st.id} className="text-base py-1 leading-relaxed flex items-start whitespace-normal">
                              <span className="font-bold text-lg min-w-[28px] shrink-0" style={{ color: st.text_color }}>{st.code}:</span>
                              <span className="text-gray-900 font-medium ml-1 flex-1 mt-0.5">{emps.join(', ')}</span>
                            </div>`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log('REPLACED FONT');
