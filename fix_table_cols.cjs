const fs = require('fs');
const file = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `<td className="border border-gray-300 p-2 text-center font-medium">{idx + 1}</td>`;
const replacement = `<td className="border border-gray-300 p-1 text-center bg-white cursor-pointer" onClick={() => canEdit && handleSelectRow(emp.id)}>
                            {canEdit && (
                              <input 
                                type="checkbox" 
                                className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                checked={selectedRowIds.includes(emp.id)}
                                onChange={() => handleSelectRow(emp.id)}
                                onClick={e => e.stopPropagation()}
                              />
                            )}
                          </td>
                          <td className="border border-gray-300 p-2 text-center font-medium">{idx + 1}</td>`;

content = content.replace(target, replacement);

fs.writeFileSync(file, content, 'utf8');
console.log('OK');
