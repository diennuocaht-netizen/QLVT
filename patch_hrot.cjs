const fs = require('fs');
const file = 'src/pages/HRTasks.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add imports
content = content.replace(
  "import { Plus, Search, Filter, Calendar as CalendarIcon, Clock, ArrowRight, User } from 'lucide-react';",
  "import { Plus, Search, Filter, Calendar as CalendarIcon, Clock, ArrowRight, User, CheckCircle, Edit3, Trash2 } from 'lucide-react';\nimport { ShiftTaskModal } from '../components/hr/ShiftTaskModal';\nimport { HandoverModal } from '../components/hr/HandoverModal';"
);

// 2. Add state
const stateInjection = `
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [handoverTask, setHandoverTask] = useState<any | null>(null);
`;

content = content.replace("const [searchTerm, setSearchTerm] = useState('');", "const [searchTerm, setSearchTerm] = useState('');\n" + stateInjection);

// 3. Add Quick Action handlers
const quickActionInjection = `
  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase.from('hr_shift_tasks').update({ status: newStatus }).eq('id', taskId);
      if (error) throw error;
      fetchTasks();
    } catch (err: any) {
      console.error(err);
      alert('Lỗi cập nhật: ' + err.message);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Bạn có chắc muốn xóa công việc này?')) return;
    try {
      const { error } = await supabase.from('hr_shift_tasks').delete().eq('id', taskId);
      if (error) throw error;
      fetchTasks();
    } catch (err: any) {
      console.error(err);
      alert('Lỗi xóa: ' + err.message);
    }
  };
`;

content = content.replace("const columns = [", quickActionInjection + "\n  const columns = [");

// 4. Change the "Tạo công việc" button onClick
content = content.replace("onClick={() => alert('Tính năng thêm công việc sẽ được triển khai ở Giai đoạn 2.')}", "onClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }}");

// 5. Update Task Render in the columns map
const oldTaskRender = `<div key={task.id} className="bg-white border border-gray-200 rounded p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer">`;
const newTaskRenderStart = `<div key={task.id} className="bg-white border border-gray-200 rounded p-3 shadow-sm hover:shadow-md transition-shadow group relative">
                          <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded px-1">
                             <button onClick={() => { setEditingTask(task); setIsTaskModalOpen(true); }} className="p-1 text-gray-400 hover:text-indigo-600 rounded"><Edit3 size={14}/></button>
                             {canEdit && <button onClick={() => deleteTask(task.id)} className="p-1 text-gray-400 hover:text-red-600 rounded"><Trash2 size={14}/></button>}
                          </div>`;

content = content.replace(new RegExp(oldTaskRender.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newTaskRenderStart);

const oldFooterRender = `<div className="flex items-center text-xs text-gray-600">
                              <User className="w-3.5 h-3.5 mr-1" />
                              {task.assignee?.display_name || 'Chưa phân công'}
                            </div>`;
const newFooterRender = `${oldFooterRender}
                            <div className="flex items-center space-x-1">
                               {task.status !== 'done' && task.status !== 'handover' && (
                                 <button onClick={() => updateTaskStatus(task.id, 'done')} title="Hoàn thành ngay" className="p-1 rounded hover:bg-green-100 text-gray-400 hover:text-green-600 transition-colors">
                                   <CheckCircle size={16} />
                                 </button>
                               )}
                               {task.status !== 'done' && task.status !== 'handover' && (
                                 <button onClick={() => { setHandoverTask(task); setIsHandoverModalOpen(true); }} title="Bàn giao ca sau" className="p-1 rounded hover:bg-orange-100 text-gray-400 hover:text-orange-600 transition-colors flex items-center">
                                   <ArrowRight size={16} />
                                 </button>
                               )}
                            </div>`;
content = content.replace(new RegExp(oldFooterRender.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newFooterRender);

// 6. Add modals at the end of the HRTasks div
const oldEnd = `</div>
    </div>
  );`;

const newEnd = `</div>
      {isTaskModalOpen && (
        <ShiftTaskModal
          task={editingTask}
          selectedDate={selectedDate}
          selectedShiftId={selectedShiftId}
          onClose={() => setIsTaskModalOpen(false)}
          onSaved={() => {
            setIsTaskModalOpen(false);
            fetchTasks();
          }}
        />
      )}
      {isHandoverModalOpen && handoverTask && (
        <HandoverModal
          task={handoverTask}
          shiftTypes={shiftTypes}
          onClose={() => setIsHandoverModalOpen(false)}
          onSaved={() => {
            setIsHandoverModalOpen(false);
            fetchTasks();
          }}
        />
      )}
    </div>
  );`;

content = content.replace(oldEnd, newEnd);
fs.writeFileSync(file, content, 'utf8');
console.log('HRTasks.tsx patched with Modals and Logic.');
