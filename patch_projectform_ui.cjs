const fs = require('fs');
const file = 'src/components/projects/ProjectForm.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add task logic
const taskLogic = `
  const addTask = () => {
    setTasks([...tasks, { id: crypto.randomUUID(), name: '', start_date: '', end_date: '', progress: 0, status: 'pending' }]);
  };

  const removeTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const updateTask = (index: number, field: string, value: any) => {
    const newTasks = [...tasks];
    newTasks[index] = { ...newTasks[index], [field]: value };
    setTasks(newTasks);
  };
`;

content = content.replace("const addAttachment = () => {", taskLogic + "\n  const addAttachment = () => {");

// We also need to add tasks to the payload!
content = content.replace("contacts, // use state", "contacts, // use state\n          tasks, // use state");

// Add Task UI
const attachmentsMarker = `<div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">TAi li?u dnh kAm</h3>`; // wait, I don't know the exact string.

// Let's use string indexOf to insert right before Tài liệu đính kèm or right after Nguời liên hệ
const idxAttachments = content.indexOf('<h3 className="text-lg font-medium text-gray-900">Tài liệu đính kèm</h3>');
if (idxAttachments !== -1) {
  const startDivAtt = content.lastIndexOf('<div', idxAttachments);
  const tasksUI = `
              {/* Thêm hạng mục công việc */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    <ListTodo className="w-5 h-5 text-indigo-500" /> Hạng mục công việc
                  </h3>
                  <button
                    type="button"
                    onClick={addTask}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none"
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
              </div>
  `;
  content = content.substring(0, startDivAtt) + tasksUI + content.substring(startDivAtt);
}

// Add ListTodo to lucide-react import
content = content.replace(/import\s*\{\s*X,\s*Plus,\s*Trash2,\s*Paperclip\s*\}\s*from\s*'lucide-react';/, "import { X, Plus, Trash2, Paperclip, ListTodo } from 'lucide-react';");

fs.writeFileSync(file, content, 'utf8');
console.log('OK UI patched');
