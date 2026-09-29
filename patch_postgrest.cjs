const fs = require('fs');
const file = 'src/pages/HRTasks.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix the embed relationship explicitly!
content = content.replace(
  "select(`*, assignee:users(id, display_name), shift:shift_types(id, name, code)`)",
  "select(`*, assignee:users!hr_shift_tasks_assignee_id_fkey(id, display_name), shift:shift_types(id, name, code)`)"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed HRTasks PostgREST explicit join.');
