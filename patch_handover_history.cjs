const fs = require('fs');
const file = 'src/components/hr/HandoverModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldClone = `      // 2. Clone the task to the new shift
      const { data: clonedTask, error: cloneError } = await supabase.from('hr_shift_tasks').insert([{
        title: task.title,
        description: task.description,
        date: nextDate,
        shift_id: nextShiftId,
        assignee_id: task.assignee_id,
        priority: task.priority,
        status: 'todo',
        created_by: profile?.id
      }]).select();`;

const newClone = `      // 2. Clone the task to the new shift
      const oldShiftName = shiftTypes.find(s => s.id === task.shift_id)?.name || 'Ca trước';
      const historyStamp = \`\\n\\n[BÀN GIAO TỪ \${oldShiftName.toUpperCase()} - \${new Date(task.date).toLocaleDateString('vi-VN')}]: \${handoverNote}\`;
      const newDescription = (task.description || '') + historyStamp;

      const { data: clonedTask, error: cloneError } = await supabase.from('hr_shift_tasks').insert([{
        title: task.title,
        description: newDescription,
        date: nextDate,
        shift_id: nextShiftId,
        assignee_id: task.assignee_id,
        priority: task.priority,
        status: 'todo',
        created_by: profile?.id || null
      }]).select();`;

content = content.replace(oldClone, newClone);
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed HandoverModal to keep history.');
