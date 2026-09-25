const fs = require('fs');
const file = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add states
if (!content.includes('const [draggedIdx, setDraggedIdx] = useState<number | null>(null);')) {
  content = content.replace(
    "const [editedEmployees, setEditedEmployees] = useState<Record<string, {full_name?: string, role?: string}>>({});",
    "const [editedEmployees, setEditedEmployees] = useState<Record<string, {full_name?: string, role?: string}>>({});\n  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);\n  const [monthCreatedState, setMonthCreatedState] = useState<Record<string, boolean>>({});"
  );
}

// 2. Add handleDrop function
if (!content.includes('const handleDrop = async')) {
  content = content.replace(
    "const employeesByTeam = useMemo(() => {",
    `const handleDrop = async (targetIdx: number) => {
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    const newEmployees = [...employees];
    const [draggedEmp] = newEmployees.splice(draggedIdx, 1);
    newEmployees.splice(targetIdx, 0, draggedEmp);
    
    // update order_index locally
    const updatedEmployees = newEmployees.map((emp, i) => ({ ...emp, order_index: i }));
    setEmployees(updatedEmployees);
    setDraggedIdx(null);
    
    // save to DB quietly
    try {
      const upserts = updatedEmployees.map(e => ({ 
        id: e.id, 
        full_name: e.full_name,
        role: e.role,
        team_id: e.team_id,
        order_index: e.order_index 
      }));
      await supabase.from('shift_employees').upsert(upserts);
    } catch (e) {
      console.error('Error reordering', e);
    }
  };

  const employeesByTeam = useMemo(() => {`
  );
}

// 3. Update table row for dragging
content = content.replace(
  '<tr key={emp.id} className="hover:bg-gray-50">',
  `<tr 
                          key={emp.id} 
                          className={\`hover:bg-gray-50 \${draggedIdx === idx ? 'opacity-50 bg-indigo-50' : ''}\`}
                          draggable={canEdit}
                          onDragStart={() => setDraggedIdx(idx)}
                          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                          onDrop={(e) => { e.preventDefault(); handleDrop(idx); }}
                        >`
);

// 4. Highlight Today & Month Creation Logic
content = content.replace(
  "const daysInMonth = new Date(year, month, 0).getDate();",
  `const daysInMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year;`
);

content = content.replace(
  "const cellBg = isWeekend ? 'bg-red-50 text-red-600' : 'bg-gray-50';",
  `const isToday = isCurrentMonth && d.day === today.getDate();
        const cellBg = isToday ? 'bg-blue-100 text-blue-900 border-blue-300 font-bold' : isWeekend ? 'bg-red-50 text-red-600' : 'bg-gray-50';`
);

// Replace header bg-gray-50 with cellBg for dates
content = content.replace(
  `<th key={d.day} className={\`border border-gray-300 p-2 text-center \${isWeekend ? 'bg-red-50 text-red-600' : 'bg-gray-50'} w-12 text-xs\`}>
                      <div className="font-medium">{['CN','T2','T3','T4','T5','T6','T7'][d.date.getDay()]}</div>
                      <div className="font-bold text-sm">{d.day}</div>
                    </th>`,
  `<th key={d.day} className={\`border border-gray-300 p-2 text-center \${isCurrentMonth && d.day === today.getDate() ? 'bg-blue-100 text-blue-900 border-blue-500 border-x-2' : isWeekend ? 'bg-red-50 text-red-600' : 'bg-gray-50'} w-12 text-xs\`}>
                      <div className="font-medium">{['CN','T2','T3','T4','T5','T6','T7'][d.date.getDay()]}</div>
                      <div className="font-bold text-sm">{d.day}</div>
                    </th>`
);

// Add bg highlight to cells
content = content.replace(
  `<td key={d.day} className={\`border border-gray-300 p-0 text-center \${isWeekend ? 'bg-red-50' : 'bg-white'}\`}>`,
  `<td key={d.day} className={\`border border-gray-300 p-0 text-center \${isCurrentMonth && d.day === today.getDate() ? 'bg-blue-50 border-blue-500 border-x-2' : isWeekend ? 'bg-red-50' : 'bg-white'}\`}>`
);

// 5. Wrap table in month-created check
const matrixWrapStart = `{loading ? (
            <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>
          ) : employees.length === 0 ? (`.replace('Đ', '?').replace('ả', '').replace('ữ', '_').replace('ệ', '');
          
content = content.replace(
  "{loading ? (",
  `{loading ? (`
);

fs.writeFileSync(file, content, 'utf8');
console.log('OK');
