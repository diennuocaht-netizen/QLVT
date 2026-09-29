const fs = require('fs');
const file = 'src/components/hr/EventDetailsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const titleInput = `                            <input
                              type="text"
                              value={task.title}
                              onChange={(e) => updateLocalTask(task.id, { title: e.target.value })} onBlur={(e) => saveTaskToDb(task.id, { title: e.target.value })}
                              disabled={!canEdit}
                              placeholder="Tên hạng mục..."
                              className="w-full font-bold text-gray-900 border-none bg-transparent focus:ring-0 p-0 text-base"
                            />`;

const titlePlusDesc = `                            <input
                              type="text"
                              value={task.title}
                              onChange={(e) => updateLocalTask(task.id, { title: e.target.value })} onBlur={(e) => saveTaskToDb(task.id, { title: e.target.value })}
                              disabled={!canEdit}
                              placeholder="Tên hạng mục..."
                              className="w-full font-bold text-gray-900 border-none bg-transparent focus:ring-0 p-0 text-base mb-1"
                            />
                            <textarea
                              value={task.description || ''}
                              onChange={(e) => updateLocalTask(task.id, { description: e.target.value })}
                              onBlur={(e) => saveTaskToDb(task.id, { description: e.target.value })}
                              disabled={!canEdit}
                              placeholder="Mô tả chi tiết hạng mục (yêu cầu, lưu ý...)"
                              rows={1}
                              className="w-full text-sm text-gray-600 border-none bg-transparent focus:ring-0 p-0 resize-none mb-2"
                            />`;

content = content.replace(titleInput, titlePlusDesc);
fs.writeFileSync(file, content, 'utf8');
console.log('Added description to tasks.');
