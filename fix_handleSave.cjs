const fs = require('fs');
const file = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update handleSave
const oldHandleSave = `        const upserts: any[] = [];
        Object.keys(editedAssignments).forEach(empId => {
          Object.keys(editedAssignments[empId]).forEach(dateStr => {
            upserts.push({
              employee_id: empId,
              date: dateStr,
              shift_type_id: editedAssignments[empId][dateStr] || null
            });
          });
        });`;

const newHandleSave = `        const upserts: any[] = [];
        const deletes: {empId: string, dateStr: string}[] = [];
        Object.keys(editedAssignments).forEach(empId => {
          Object.keys(editedAssignments[empId]).forEach(dateStr => {
            const sId = editedAssignments[empId][dateStr];
            if (sId) {
              upserts.push({
                employee_id: empId,
                date: dateStr,
                shift_type_id: sId
              });
            } else {
              deletes.push({ empId, dateStr });
            }
          });
        });`;
        
content = content.replace(oldHandleSave, newHandleSave);

const oldUpsertExecution = `        if (upserts.length > 0) {
          const { error } = await supabase.from('shift_assignments').upsert(upserts, { onConflict: 'employee_id,date' });
          if (error) throw error;
          
          // Merge edited back to assignments`;

const newUpsertExecution = `        if (upserts.length > 0 || deletes.length > 0) {
          if (upserts.length > 0) {
            const { error } = await supabase.from('shift_assignments').upsert(upserts, { onConflict: 'employee_id,date' });
            if (error) throw error;
          }
          
          if (deletes.length > 0) {
            for (const del of deletes) {
              await supabase.from('shift_assignments').delete().match({ employee_id: del.empId, date: del.dateStr });
            }
          }
          
          // Merge edited back to assignments`;

content = content.replace(oldUpsertExecution, newUpsertExecution);

fs.writeFileSync(file, content, 'utf8');
console.log('OK');
