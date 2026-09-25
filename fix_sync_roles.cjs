const fs = require('fs');
const file = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldSyncLogic = `      if (newEmployees.length > 0) {
        const { error: insertError } = await supabase.from('shift_employees').insert(newEmployees);
        if (insertError) throw insertError;
      }
      
      if (newEmployees.length > 0 || toDelete.length > 0) {
        alert(\`Đồng bộ hoàn tất: Thêm \${newEmployees.length} nhân sự mới, Xóa \${toDelete.length} nhân sự cũ.\`);
        fetchAllData();
      } else {
        alert('Danh sách nhân sự đã được đồng bộ đầy đủ, không có sự thay đổi.');
      }`;

const newSyncLogic = `      if (newEmployees.length > 0) {
        const { error: insertError } = await supabase.from('shift_employees').insert(newEmployees);
        if (insertError) throw insertError;
      }
      
      // Check for users to update job_title
      let updatedCount = 0;
      for (const emp of employees) {
        const u = users.find((u: any) => 
          (u.display_name && u.display_name.toLowerCase() === emp.full_name.toLowerCase()) ||
          (u.email && u.email.toLowerCase() === emp.full_name.toLowerCase())
        );
        if (u) {
          const userJobTitle = u.job_title || '';
          const currentRole = emp.role || '';
          if (userJobTitle !== currentRole) {
            await supabase.from('shift_employees').update({ role: userJobTitle }).eq('id', emp.id);
            updatedCount++;
          }
        }
      }
      
      if (newEmployees.length > 0 || toDelete.length > 0 || updatedCount > 0) {
        alert(\`Đồng bộ hoàn tất: Thêm \${newEmployees.length} mới, Xóa \${toDelete.length} cũ, Cập nhật chức danh \${updatedCount} người.\`);
        fetchAllData();
      } else {
        alert('Danh sách nhân sự và chức danh đã được đồng bộ đầy đủ, không có sự thay đổi.');
      }`;

content = content.replace(oldSyncLogic, newSyncLogic);
fs.writeFileSync(file, content, 'utf8');
console.log('OK');
