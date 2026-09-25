const fs = require('fs');
const file = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add editedEmployees state
content = content.replace(
  "const [editedAssignments, setEditedAssignments] = useState<Record<string, Record<string, string>>>({});",
  "const [editedAssignments, setEditedAssignments] = useState<Record<string, Record<string, string>>>({});\n  const [editedEmployees, setEditedEmployees] = useState<Record<string, {full_name?: string, role?: string}>>({});"
);

// 2. Clear editedEmployees in fetchAllData
content = content.replace(
  "setEditedAssignments({}); // Reset edits",
  "setEditedAssignments({}); // Reset edits\n        setEditedEmployees({});"
);
content = content.replace(
  "setEditedAssignments({});\n      }",
  "setEditedAssignments({});\n        setEditedEmployees({});\n      }"
);

// 3. Update handleSave
content = content.replace(
  "      if (upserts.length > 0) {",
        // save employee edits
      const empUpserts: any[] = [];
      Object.keys(editedEmployees).forEach(empId => {
        const emp = employees.find(e => e.id === empId);
        if (emp) {
          empUpserts.push({
            id: empId,
            full_name: editedEmployees[empId].full_name ?? emp.full_name,
            role: editedEmployees[empId].role ?? emp.role,
            team_id: emp.team_id,
            order_index: emp.order_index
          });
        }
      });
      if (empUpserts.length > 0) {
        const { error } = await supabase.from('shift_employees').upsert(empUpserts);
        if (error) throw error;
      }

      if (upserts.length > 0) {
);

content = content.replace(
  "setEditedAssignments({});\n        alert('Lưu phân ca thành công!');",
  "setEditedAssignments({});\n        setEditedEmployees({});\n        alert('Lưu phân ca thành công!');"
);
content = content.replace(
  "alert('Không có thay đổi nào để lưu.');",
  "if (empUpserts.length > 0) {\n          setEditedEmployees({});\n          alert('Lưu thay đổi thành công!');\n          fetchAllData();\n        } else {\n          alert('Không có thay đổi nào để lưu.');\n        }"
);

// 4. Update handleSyncEmployees
content = content.replace(
  /const handleSyncEmployees = async \(\) => \{[\s\S]*?finally \{\s*setSyncing\(false\);\s*\}\s*\};/,
  const handleSyncEmployees = async () => {
    if (!window.confirm('Bạn có muốn đồng bộ danh sách nhân sự từ hệ thống tài khoản không? Các nhân sự mới sẽ được thêm vào bảng.')) return;
    setSyncing(true);
    try {
      const { data: users, error } = await supabase.from('users').select('*');
      if (error) throw error;
      if (!users || users.length === 0) {
        alert('Không tìm thấy tài khoản nào trong hệ thống!');
        return;
      }
      
      const newEmployees = users
        .filter((u: any) => !employees.some(e => e.full_name.toLowerCase() === (u.display_name || u.email).toLowerCase()))
        .map((u: any, index: number) => ({
          full_name: u.display_name || u.email,
          role: '', 
          order_index: employees.length + index
        }));

      if (newEmployees.length > 0) {
        const { error: insertError } = await supabase.from('shift_employees').insert(newEmployees);
        if (insertError) throw insertError;
        alert(\Đã thêm \ nhân sự mới!\);
        fetchAllData();
      } else {
        alert('Danh sách nhân sự đã được đồng bộ đầy đủ, không có người mới.');
      }
    } catch (error) {
      console.error('Error syncing employees:', error);
      alert('Đồng bộ thất bại. Vui lòng thử lại.');
    } finally {
      setSyncing(false);
    }
  };
);

// 5. Update Excel import matching
content = content.replace(
  "matchedEmp = employees.find(e => e.full_name.toLowerCase() === name);",
  const removeAccents = (str: string) => str.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
              const nameStr = removeAccents(name).toLowerCase();
              matchedEmp = employees.find(e => {
                const empNameStr = removeAccents(e.full_name).toLowerCase().trim();
                return nameStr.includes(empNameStr) || empNameStr.includes(nameStr) || nameStr === empNameStr;
              });
);

// 6. hasUnsavedChanges
content = content.replace(
  "const hasUnsavedChanges = Object.keys(editedAssignments).length > 0;",
  "const hasUnsavedChanges = Object.keys(editedAssignments).length > 0 || Object.keys(editedEmployees).length > 0;"
);

// 7. Render inputs
content = content.replace(
  <td className="border border-gray-300 p-2 font-bold sticky left-0 z-10 bg-white" style={{ backgroundColor: teamColor !== 'transparent' ? teamColor : '#fff' }}>
                          {emp.full_name}
                        </td>
                        <td className="border border-gray-300 p-2 text-xs" style={{ backgroundColor: teamColor !== 'transparent' ? teamColor : '#fff' }}>
                          {emp.role}
                        </td>,
  <td className="border border-gray-300 p-0 font-bold sticky left-0 z-10 bg-white" style={{ backgroundColor: teamColor !== 'transparent' ? teamColor : '#fff' }}>
                          <input 
                            type="text" 
                            className="w-full h-full border-0 bg-transparent px-2 py-2 focus:ring-1 focus:ring-indigo-500 font-bold text-sm"
                            value={editedEmployees[emp.id]?.full_name ?? emp.full_name}
                            onChange={(e) => setEditedEmployees(prev => ({ ...prev, [emp.id]: { ...prev[emp.id], full_name: e.target.value } }))}
                          />
                        </td>
                        <td className="border border-gray-300 p-0 text-xs" style={{ backgroundColor: teamColor !== 'transparent' ? teamColor : '#fff' }}>
                          <input 
                            type="text" 
                            className="w-full h-full border-0 bg-transparent px-2 py-2 focus:ring-1 focus:ring-indigo-500 text-xs"
                            placeholder="Chức danh..."
                            value={editedEmployees[emp.id]?.role ?? emp.role ?? ''}
                            onChange={(e) => setEditedEmployees(prev => ({ ...prev, [emp.id]: { ...prev[emp.id], role: e.target.value } }))}
                          />
                        </td>
);

// 8. Add Sync button to header UI (if not empty)
content = content.replace(
                <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-md flex items-center text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                title="Nhập lịch từ file Excel"
              >
                <Upload className="w-4 h-4 mr-1.5" />
                Nhập Excel
              </button>,
                <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-md flex items-center text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                title="Nhập lịch từ file Excel"
              >
                <Upload className="w-4 h-4 mr-1.5" />
                Nhập Excel
              </button>
              
              <button
                onClick={handleSyncEmployees}
                disabled={syncing}
                className="px-3 py-1.5 rounded-md flex items-center text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                title="Đồng bộ lại nhân sự mới từ hệ thống"
              >
                <Users className="w-4 h-4 mr-1.5" />
                Đồng bộ NS
              </button>
);

fs.writeFileSync(file, content, 'utf8');
console.log('OK');
