const fs = require('fs');
const file = 'src/components/hr/ShiftTaskModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldPayload = `      const payload = {
        ...formData,
        updated_at: new Date().toISOString()
      };`;
const newPayload = `      const payload = {
        ...formData,
        assignee_id: formData.assignee_id || null,
        shift_id: formData.shift_id || null,
        updated_at: new Date().toISOString()
      };`;

content = content.replace(oldPayload, newPayload);
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed ShiftTaskModal payload.');
