const fs = require('fs');
const file = 'src/pages/HRTasks.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix group_id fallback logic
content = content.replace(
  "const handoverGroupIds = data.filter(t => t.status === 'handover' && t.group_id).map(t => t.group_id);",
  "const handoverGroupIds = data.filter(t => t.status === 'handover').map(t => t.group_id || t.id);"
);

content = content.replace(
  "{task.group_id && (",
  "{(task.group_id || task.id) && ("
);
content = content.replace(
  "setTimelineGroupId(task.group_id)",
  "setTimelineGroupId(task.group_id || task.id)"
);

content = content.replace(
  "task.status === 'handover' && groupStatuses[task.group_id]",
  "task.status === 'handover' && groupStatuses[task.group_id || task.id]"
);
content = content.replace(
  "groupStatuses[task.group_id].status === 'done'",
  "groupStatuses[task.group_id || task.id].status === 'done'"
);
content = content.replace(
  "bởi {groupStatuses[task.group_id].shift",
  "bởi {groupStatuses[task.group_id || task.id].shift"
);

// 2. Add Complete Modal logic
content = content.replace(
  "const [timelineGroupId, setTimelineGroupId] = useState<string | null>(null);",
  "const [timelineGroupId, setTimelineGroupId] = useState<string | null>(null);\n  const [completingTask, setCompletingTask] = useState<any | null>(null);\n  const [completionNote, setCompletionNote] = useState('');"
);

// Update Complete Quick Action button
const oldCompleteBtn = `<button onClick={() => updateTaskStatus(task.id, 'done')} title="Hoàn thành ngay" className="p-1 rounded hover:bg-green-100 text-gray-400 hover:text-green-600 transition-colors">`;
const newCompleteBtn = `<button onClick={(e) => { e.stopPropagation(); setCompletionNote(''); setCompletingTask(task); }} title="Hoàn thành & Ghi chú" className="p-1 rounded hover:bg-green-100 text-gray-400 hover:text-green-600 transition-colors">`;
content = content.replace(new RegExp(oldCompleteBtn.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newCompleteBtn);

// Add the handleComplete function
const completeLogic = `
  const handleCompleteTask = async () => {
    if (!completingTask) return;
    setLoading(true);
    try {
      const newDescription = completionNote.trim() 
        ? (completingTask.description ? completingTask.description + '\\n\\n[KẾT LUẬN XỬ LÝ]: ' + completionNote : '[KẾT LUẬN XỬ LÝ]: ' + completionNote)
        : completingTask.description;
        
      const { error } = await supabase.from('hr_shift_tasks').update({ 
        status: 'done',
        description: newDescription,
        updated_at: new Date().toISOString()
      }).eq('id', completingTask.id);
      
      if (error) throw error;
      
      setCompletingTask(null);
      fetchTasks();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };
`;
content = content.replace("const updateTaskStatus = async", completeLogic + "\n  const updateTaskStatus = async");

// Add Modal UI at the end
const modalUI = `
      {completingTask && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-green-50">
              <h2 className="text-lg font-bold text-green-800 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                Hoàn thành công việc
              </h2>
              <button onClick={() => setCompletingTask(null)} className="text-green-400 hover:text-green-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <p className="text-sm font-bold text-gray-900">{completingTask.title}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Kết luận xử lý (Tùy chọn)</label>
                <p className="text-xs text-gray-500 mb-2">Ghi lại kết quả, nguyên nhân hoặc thông số đo đạc được.</p>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                  <textarea
                    value={completionNote}
                    onChange={(e) => setCompletionNote(e.target.value)}
                    rows={4}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Ví dụ: Đã thay thế aptomat mới, thông số dòng ổn định 15A..."
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCompletingTask(null)}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleCompleteTask}
                disabled={loading}
                className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div> : null}
                Lưu & Hoàn thành
              </button>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace("{timelineGroupId && (", modalUI + "\n      {timelineGroupId && (");

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed HRTasks group_id logic and added Completion Modal.');
