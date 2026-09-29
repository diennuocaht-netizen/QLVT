const fs = require('fs');
const file = 'src/pages/HRTasks.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Imports
if (!content.includes('RoutineChecklistModal')) {
  content = content.replace(
    "import { ShiftTaskModal } from '../components/hr/ShiftTaskModal';",
    "import { ShiftTaskModal } from '../components/hr/ShiftTaskModal';\nimport { RoutineChecklistModal } from '../components/hr/RoutineChecklistModal';"
  );
}
if (!content.includes('Settings')) {
  content = content.replace(
    "import { Plus, Search, Calendar as CalendarIcon, Clock, Edit, Trash, FileText, ArrowRight, User } from 'lucide-react';",
    "import { Plus, Search, Calendar as CalendarIcon, Clock, Edit, Trash, FileText, ArrowRight, User, Settings } from 'lucide-react';"
  );
}

// 2. State
if (!content.includes('isRoutineModalOpen')) {
  content = content.replace(
    "const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);",
    "const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);\n  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);"
  );
}

// 3. Logic
const oldLogic = /const generateRoutineTasks = async \(\) => \{[\s\S]*?fetchTasks\(\);\s*\} catch \(err: any\) \{/m;
const newLogic = `const generateRoutineTasks = async () => {
    if (!selectedShiftId || selectedShiftId === 'all') {
      alert('Vui lòng chọn một Ca cụ thể để sinh checklist!');
      return;
    }
    setLoading(true);
    try {
      const { data: routines, error: fetchErr } = await supabase
        .from('shift_routine_tasks')
        .select('*')
        .eq('shift_type_id', selectedShiftId)
        .eq('is_active', true);
        
      if (fetchErr) throw fetchErr;
      
      if (!routines || routines.length === 0) {
        alert('Ca này chưa được cấu hình công việc định kỳ. Vui lòng vào Cấu hình để thiết lập.');
        setLoading(false);
        return;
      }
      
      const inserts = routines.map(r => ({
        title: r.title,
        description: r.description || 'Công việc định kỳ sinh tự động',
        date: selectedDate,
        shift_id: selectedShiftId,
        priority: r.priority || 'medium',
        status: 'todo',
        created_by: profile?.id || null,
        group_id: crypto.randomUUID()
      }));

      const { error } = await supabase.from('hr_shift_tasks').insert(inserts);
      if (error) throw error;
      
      alert('Đã sinh Checklist thành công!');
      fetchTasks();
    } catch (err: any) {`;

content = content.replace(oldLogic, newLogic);

// 4. Buttons
const oldBtn = /<button\s+className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center shadow-sm \s*font-medium transition-colors"\s*onClick=\{generateRoutineTasks\}\s*title="T\? d\?ng t\?o cc cng vi\?c b\?t bu\?c cho ca da ch\?n"\s*>\s*<FileText className="w-4 h-4 mr-2" \/>\s*Sinh Check-list\s*<\/button>/m;
const oldBtnRegexFallback = /\{canEdit && \(\s*<button[\s\S]*?Sinh Check-list\s*<\/button>\s*\)\}/m;

const newBtn = `{canEdit && (
              <>
                <button
                  className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 flex items-center shadow-sm font-medium transition-colors border border-gray-200"
                  onClick={() => setIsRoutineModalOpen(true)}
                  title="Cấu hình Checklist cho ca"
                >
                  <Settings className="w-4 h-4 mr-1.5" />
                  Cấu hình
                </button>
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center shadow-sm font-medium transition-colors"
                  onClick={generateRoutineTasks}
                  title="Tự động tạo Checklist đã cấu hình cho ca"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Checklist
                </button>
              </>
            )}`;

if (content.match(oldBtnRegexFallback)) {
  content = content.replace(oldBtnRegexFallback, newBtn);
} else {
  console.log("Could not match oldBtn regex!");
}

// 5. Mount Modal
const mountRegex = /<ShiftTaskModal[\s\S]*?<\/ShiftTaskModal>/m;
const modalComponent = `<RoutineChecklistModal
        isOpen={isRoutineModalOpen}
        onClose={() => setIsRoutineModalOpen(false)}
        shiftTypeId={selectedShiftId === 'all' ? '' : selectedShiftId}
      />`;

if (content.includes('</ShiftTaskModal>') && !content.includes('<RoutineChecklistModal')) {
  content = content.replace(mountRegex, (match) => match + '\n      ' + modalComponent);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Patched HRTasks.tsx');
