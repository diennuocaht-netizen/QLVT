const fs = require('fs');
const file = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix name matching in Excel
content = content.replace(
  /matchedEmp = employees\.find\(e => \{[\s\S]*?\}\);/,
  `matchedEmp = employees.find(e => {
                const empNameStr = removeAccents(e.full_name).toLowerCase().trim();
                return nameStr === empNameStr; // TRULY EXACT MATCH to prevent shift collisions
              });`
);

// 2. Change Import Excel to Auto-save
// Find: setEditedAssignments(newEditedAssignments);
// Replace with immediate save logic
content = content.replace(
  "setEditedAssignments(newEditedAssignments);\n        alert(`Đã nạp thành công lịch của ${matchCount} nhân sự. Nhấn \"Lưu thay đổi\" để cập nhật lên hệ thống.`);",
  `setEditedAssignments(newEditedAssignments);
        // AUTO SAVE IMMEDIATELY
        const upserts: any[] = [];
        Object.keys(newEditedAssignments).forEach(empId => {
          Object.keys(newEditedAssignments[empId]).forEach(dateStr => {
            upserts.push({
              employee_id: empId,
              date: dateStr,
              shift_type_id: newEditedAssignments[empId][dateStr] || null
            });
          });
        });
        if (upserts.length > 0) {
          const { error } = await supabase.from('shift_assignments').upsert(upserts, { onConflict: 'employee_id,date' });
          if (error) throw error;
          alert(\`Đã nạp và tự động lưu thành công lịch của \${matchCount} nhân sự.\`);
          fetchAllData();
        } else {
          alert('Không có dữ liệu lịch nào được nạp.');
        }`
);

// 3. Add Trash icon import
content = content.replace(
  "import { Calendar, LayoutGrid, ChevronLeft, ChevronRight, Save, Plus, Users, Upload } from 'lucide-react';",
  "import { Calendar, LayoutGrid, ChevronLeft, ChevronRight, Save, Plus, Users, Upload, Trash2 } from 'lucide-react';"
);

// 4. Add handleDeleteEmployee function
content = content.replace(
  "// Group employees by team for display",
  `const handleDeleteEmployee = async (empId: string, empName: string) => {
    if (!window.confirm(\`Bạn có chắc chắn muốn xóa nhân sự "\${empName}" khỏi bảng phân ca? Mọi dữ liệu lịch của người này sẽ bị xóa.\`)) return;
    try {
      setLoading(true);
      const { error } = await supabase.from('shift_employees').delete().eq('id', empId);
      if (error) throw error;
      alert('Đã xóa thành công!');
      fetchAllData();
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Lỗi khi xóa nhân sự.');
      setLoading(false);
    }
  };

  // Group employees by team for display`
);

// 5. Add Delete column in Matrix view
content = content.replace(
  `<th className="border border-gray-300 p-2 text-center bg-gray-50 w-16">RMIT</th>`,
  `<th className="border border-gray-300 p-2 text-center bg-gray-50 w-16">RMIT</th>
                  <th className="border border-gray-300 p-2 text-center bg-gray-50 w-10"></th>`
);

content = content.replace(
  `title="Cột này cần cập nhật qua form riêng (tương lai)"
                          />
                        </td>`,
  `title="Cột này cần cập nhật qua form riêng (tương lai)"
                          />
                        </td>
                        <td className="border border-gray-300 p-1 text-center bg-gray-50">
                          <button 
                            onClick={() => handleDeleteEmployee(emp.id, emp.full_name)}
                            className="p-1 text-red-500 hover:bg-red-100 rounded"
                            title="Xóa nhân sự"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>`
);

// 6. Fix Sync to also remove if missing
content = content.replace(
  `if (newEmployees.length > 0) {
        const { error: insertError } = await supabase.from('shift_employees').insert(newEmployees);
        if (insertError) throw insertError;
        alert(\`Đã thêm \${newEmployees.length} nhân sự mới!\`);
        fetchAllData();
      } else {
        alert('Danh sách nhân sự đã được đồng bộ đầy đủ, không có người mới.');
      }`,
  `// Check for users to delete
      const toDelete = employees.filter(emp => 
        !users.some((u: any) => 
          (u.display_name && u.display_name.toLowerCase() === emp.full_name.toLowerCase()) ||
          (u.email && u.email.toLowerCase() === emp.full_name.toLowerCase())
        )
      );

      if (toDelete.length > 0) {
        const { error: delError } = await supabase.from('shift_employees').delete().in('id', toDelete.map(e => e.id));
        if (delError) throw delError;
      }

      if (newEmployees.length > 0) {
        const { error: insertError } = await supabase.from('shift_employees').insert(newEmployees);
        if (insertError) throw insertError;
      }
      
      if (newEmployees.length > 0 || toDelete.length > 0) {
        alert(\`Đồng bộ hoàn tất: Thêm \${newEmployees.length} nhân sự mới, Xóa \${toDelete.length} nhân sự cũ.\`);
        fetchAllData();
      } else {
        alert('Danh sách nhân sự đã được đồng bộ đầy đủ, không có sự thay đổi.');
      }`
);

fs.writeFileSync(file, content, 'utf8');
console.log('OK');
