const fs = require('fs');
const file = 'src/components/hr/HandoverModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldClone = `      const { data: clonedTask, error: cloneError } = await supabase.from('hr_shift_tasks').insert([{
        title: task.title,
        description: newDescription,
        date: nextDate,
        shift_id: nextShiftId,
        assignee_id: task.assignee_id,
        priority: task.priority,
        status: 'todo',
        created_by: profile?.id || null
      }]).select();`;

const newClone = `      const { data: clonedTask, error: cloneError } = await supabase.from('hr_shift_tasks').insert([{
        title: task.title,
        description: newDescription,
        date: nextDate,
        shift_id: nextShiftId,
        assignee_id: task.assignee_id,
        priority: task.priority,
        status: 'todo',
        created_by: profile?.id || null,
        group_id: task.group_id || task.id // Fallback in case old task doesn't have group_id yet
      }]).select();`;

content = content.replace(oldClone, newClone);
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed HandoverModal group_id.');
