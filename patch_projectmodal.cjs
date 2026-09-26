const fs = require('fs');
const file = 'src/components/projects/ProjectDetailsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update activeTab state
content = content.replace(
  "const [activeTab, setActiveTab] = useState<'info' | 'contacts' | 'documents'>('info');",
  "const [activeTab, setActiveTab] = useState<'info' | 'tasks' | 'contacts' | 'documents'>('info');"
);

// Add tab button for Tasks
const tabContactsBtn = `<button
              onClick={() => setActiveTab('contacts')}`;
const tabTasksBtn = `<button
              onClick={() => setActiveTab('tasks')}
              className={\`py-4 px-6 text-sm font-medium border-b-2 flex items-center \${activeTab === 'tasks' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}\`}
            >
              <ListTodo className="w-4 h-4 mr-2" /> Hạng mục ({project.tasks?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('contacts')}`;
content = content.replace(tabContactsBtn, tabTasksBtn);

// Add start_date to info tab
const completionDateUI = `<div className="bg-gray-50 p-4 rounded-lg flex items-center">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Ngày hoàn thành</p>
                        <p className="text-base text-gray-900 font-semibold">{project.completion_date}</p>
                      </div>
                    </div>`;
                    
const startAndCompletionUI = `<div className="bg-gray-50 p-4 rounded-lg flex items-center">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                        <Calendar className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Ngày bắt đầu</p>
                        <p className="text-base text-gray-900 font-semibold">{project.start_date || 'Chưa cập nhật'}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg flex items-center">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center mr-3">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Ngày hoàn thành</p>
                        <p className="text-base text-gray-900 font-semibold">{project.completion_date}</p>
                      </div>
                    </div>`;
content = content.replace(completionDateUI, startAndCompletionUI);

// Add Tasks panel
const contactsPanel = `{activeTab === 'contacts' && (`;
const tasksPanel = `{activeTab === 'tasks' && (
            <div className="space-y-4">
              {project.tasks && project.tasks.length > 0 ? (
                <div className="space-y-3">
                  {project.tasks.map((task: any, index: number) => {
                    const statusColors: Record<string, string> = {
                      pending: 'bg-gray-100 text-gray-800',
                      in_progress: 'bg-blue-100 text-blue-800',
                      completed: 'bg-green-100 text-green-800',
                      delayed: 'bg-red-100 text-red-800'
                    };
                    const statusLabels: Record<string, string> = {
                      pending: 'Chưa bắt đầu',
                      in_progress: 'Đang thực hiện',
                      completed: 'Đã hoàn thành',
                      delayed: 'Đang chậm trễ'
                    };
                    return (
                    <div key={task.id || index} className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-base font-bold text-gray-900">{task.name}</h4>
                        <span className={\`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium \${statusColors[task.status] || 'bg-gray-100 text-gray-800'}\`}>
                          {statusLabels[task.status] || task.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mt-3 mb-3">
                        <div className="text-sm text-gray-600">
                          <span className="font-semibold block">Bắt đầu:</span>
                          {task.start_date || '--'}
                        </div>
                        <div className="text-sm text-gray-600">
                          <span className="font-semibold block">Hoàn thành:</span>
                          {task.end_date || '--'}
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-700">Tiến độ</span>
                          <span className="text-sm font-bold text-indigo-600">{task.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-indigo-600 h-2.5 rounded-full transition-all" style={{ width: \`\${task.progress}%\` }}></div>
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              ) : (
                <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
                  <ListTodo className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">Chưa có hạng mục công việc nào.</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'contacts' && (`;
content = content.replace(contactsPanel, tasksPanel);

content = content.replace(/import\s*\{\s*X,\s*MapPin,\s*Phone/m, "import { X, MapPin, Phone, ListTodo, Calendar");

fs.writeFileSync(file, content, 'utf8');
console.log('OK modal patched');
