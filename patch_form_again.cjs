const fs = require('fs');
const file = 'src/components/projects/ProjectForm.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetIdx = content.indexOf('addAttachment}');
if (targetIdx !== -1) {
  // Find the div containing "TAi liu" which is before the button
  // Let's just find "const addAttachment" in UI
  const searchStr = `<div className="flex justify-between items-center mb-4">`;
  const insertIdx = content.lastIndexOf(searchStr, content.indexOf('addAttachment}'));
  
  if (insertIdx !== -1 && !content.includes('Hạng mục công việc')) {
    const tasksUI = `
              {/* Thêm hạng mục công việc */}
              <div className="pt-6 border-t border-gray-200 mt-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <ListTodo className="w-5 h-5 text-indigo-500" /> Hạng mục công việc
                  </h3>
                  <button
                    type="button"
                    onClick={addTask}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none"
                  >
                    <Plus className="w-4 h-4 mr-1" /> Thêm hạng mục
                  </button>
                </div>
                
                {tasks.length === 0 ? (
                  <p className="text-sm text-gray-500 italic bg-gray-50 p-4 rounded-md text-center">Chưa có hạng mục công việc nào.</p>
                ) : (
                  <div className="space-y-4">
                    {tasks.map((task, index) => (
                      <div key={task.id || index} className="bg-gray-50 p-4 rounded-md border border-gray-200 relative">
                        <button
                          type="button"
                          onClick={() => removeTask(index)}
                          className="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                          <div className="md:col-span-12">
                            <label className="block text-xs font-medium text-gray-700">Tên hạng mục *</label>
                            <input
                              type="text"
                              value={task.name}
                              onChange={(e) => updateTask(index, 'name', e.target.value)}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              placeholder="Vd: Kéo cáp tầng 1"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-medium text-gray-700">Ngày bắt đầu</label>
                            <input
                              type="date"
                              value={task.start_date || ''}
                              onChange={(e) => updateTask(index, 'start_date', e.target.value)}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-medium text-gray-700">Ngày hoàn thành</label>
                            <input
                              type="date"
                              value={task.end_date || ''}
                              onChange={(e) => updateTask(index, 'end_date', e.target.value)}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-medium text-gray-700">Tiến độ (%)</label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={task.progress}
                              onChange={(e) => updateTask(index, 'progress', parseInt(e.target.value) || 0)}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-xs font-medium text-gray-700">Trạng thái</label>
                            <select
                              value={task.status}
                              onChange={(e) => updateTask(index, 'status', e.target.value)}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                              <option value="pending">Chưa bắt đầu</option>
                              <option value="in_progress">Đang thực hiện</option>
                              <option value="completed">Đã hoàn thành</option>
                              <option value="delayed">Đang chậm trễ</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>\n`;
    content = content.substring(0, insertIdx) + tasksUI + content.substring(insertIdx);
    fs.writeFileSync(file, content, 'utf8');
    console.log('OK UI patched in ProjectForm.tsx');
  } else {
    console.log('Already patched or insertIdx not found');
  }
}
