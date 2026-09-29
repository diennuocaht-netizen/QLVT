const fs = require('fs');
const file = 'src/components/hr/ShiftTaskModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldInsert = `        const { data, error } = await supabase.from('hr_shift_tasks').insert([{ ...payload, created_by: profile?.id || null }]).select();`;
const newInsert = `        const { data, error } = await supabase.from('hr_shift_tasks').insert([{ 
          ...payload, 
          created_by: profile?.id || null,
          group_id: crypto.randomUUID() 
        }]).select();`;

content = content.replace(oldInsert, newInsert);
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed ShiftTaskModal group_id.');
