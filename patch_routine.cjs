const fs = require('fs');
const file = 'src/pages/HRTasks.tsx';
let content = fs.readFileSync(file, 'utf8');

const injection = `
  const generateRoutineTasks = async () => {
    if (!selectedShiftId || selectedShiftId === 'all') {
      alert('Vui lòng chọn một Ca cụ thể để sinh checklist!');
      return;
    }
    setLoading(true);
    try {
      const routines = [
        { title: 'Kiểm tra thông số tủ điện chính', priority: 'high' },
        { title: 'Vệ sinh phòng máy', priority: 'low' },
        { title: 'Kiểm tra hệ thống báo cháy', priority: 'high' },
        { title: 'Đọc và ghi sổ nhật ký ca trước', priority: 'medium' }
      ];
      
      const inserts = routines.map(r => ({
        title: r.title,
        description: 'Công việc định kỳ sinh tự động',
        date: selectedDate,
        shift_id: selectedShiftId,
        priority: r.priority,
        status: 'todo',
        created_by: profile?.id
      }));

      const { error } = await supabase.from('hr_shift_tasks').insert(inserts);
      if (error) throw error;
      
      fetchTasks();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
`;

content = content.replace("const updateTaskStatus = async", injection + "\n  const updateTaskStatus = async");

const oldButton = `<button
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center shadow-sm font-medium transition-colors"
          onClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
        >
          <Plus className="w-5 h-5 mr-2" />
          Tạo công việc
        </button>`;

const newButton = `<div className="flex gap-2">
          {canEdit && (
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center shadow-sm font-medium transition-colors"
              onClick={generateRoutineTasks}
              title="Tự động tạo các công việc bắt buộc cho ca đã chọn"
            >
              <FileText className="w-4 h-4 mr-2" />
              Sinh Check-list
            </button>
          )}
          <button
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center shadow-sm font-medium transition-colors"
            onClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
          >
            <Plus className="w-5 h-5 mr-2" />
            Tạo công việc
          </button>
        </div>`;

if(content.includes('FileText') === false) {
    content = content.replace("CheckCircle, Edit3, Trash2 } from 'lucide-react';", "CheckCircle, Edit3, Trash2, FileText } from 'lucide-react';");
}
content = content.replace(oldButton, newButton);
fs.writeFileSync(file, content, 'utf8');
console.log('Added Routine Check-list generation.');
