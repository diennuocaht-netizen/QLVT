const fs = require('fs');
const file = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `            const { error } = await supabase.from('shift_assignments').upsert(upserts, { onConflict: 'employee_id,date' });
            if (error) throw error;
            alert(\`Đã nạp và tự động lưu thành công lịch của \${matchCount} nhân sự.\`);
            fetchAllData();`;

const replacement = `            const { error } = await supabase.from('shift_assignments').upsert(upserts, { onConflict: 'employee_id,date' });
            if (error) throw error;
            alert(\`Đã nạp và tự động lưu thành công lịch của \${matchCount} nhân sự.\`);
            setEditedAssignments({}); // Clear local edits so F5 behavior is consistent
            fetchAllData();`;
            
content = content.replace(target, replacement);

fs.writeFileSync(file, content, 'utf8');
console.log('OK');
