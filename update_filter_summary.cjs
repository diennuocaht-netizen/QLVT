const fs = require('fs');
const file = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add searchTerm state
if (!content.includes('const [searchTerm, setSearchTerm]')) {
  content = content.replace(
    `const [draggedIdx, setDraggedIdx] = useState<number | null>(null);`,
    `const [draggedIdx, setDraggedIdx] = useState<number | null>(null);\n  const [searchTerm, setSearchTerm] = useState('');`
  );
}

// 2. Add Search Input UI
const topBarSearch = `<div className="flex space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm nhân sự..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>`;

if (!content.includes('placeholder="Tìm nhân sự..."')) {
  content = content.replace(
    `<div className="flex space-x-3">`,
    topBarSearch
  );
  // Need to import Search icon if not already imported
  if (!content.includes('Search,')) {
    content = content.replace('Upload,', 'Upload, Search,');
  }
}

// 3. Add filteredEmployees logic
// Wait, currently it maps `employees.map`. I need to change it to `filteredEmployees.map`.
const filterLogic = `
  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return employees;
    const lower = searchTerm.toLowerCase();
    return employees.filter(e => e.full_name.toLowerCase().includes(lower) || (e.role && e.role.toLowerCase().includes(lower)));
  }, [employees, searchTerm]);
`;

if (!content.includes('const filteredEmployees')) {
  content = content.replace(
    `const employeesByTeam = useMemo(() => {`,
    filterLogic + "\n\n  const employeesByTeam = useMemo(() => {"
  );
}

// Replace employees.map with filteredEmployees.map in the body
content = content.replace(/\{employees\.map\(\(emp, idx\) =>/g, '{filteredEmployees.map((emp, idx) =>');

// Calendar view: Need to use filteredEmployees instead of employees to generate groups
content = content.replace(
  `employees.forEach(emp => {
                  const sId = getShiftValue(emp.id, d.dateStr);`,
  `filteredEmployees.forEach(emp => {
                  const sId = getShiftValue(emp.id, d.dateStr);`
);

// 4. Add Today's Summary Logic
const summaryLogic = `
  const todayCounts = useMemo(() => {
    if (!isCurrentMonth) return null;
    const dateStr = \`\${year}-\${month.toString().padStart(2, '0')}-\${today.getDate().toString().padStart(2, '0')}\`;
    const counts: Record<string, number> = {};
    let totalScheduled = 0;
    filteredEmployees.forEach(emp => {
      const sId = getShiftValue(emp.id, dateStr);
      if (sId) {
        counts[sId] = (counts[sId] || 0) + 1;
        totalScheduled++;
      }
    });
    return { counts, totalScheduled, totalEmployees: filteredEmployees.length };
  }, [assignments, editedAssignments, filteredEmployees, isCurrentMonth, year, month, today]);
`;

if (!content.includes('const todayCounts')) {
  content = content.replace(
    `const hasUnsavedChanges`,
    summaryLogic + "\n  const hasUnsavedChanges"
  );
}

// 5. Add Summary UI Below Table
const summaryUI = `
        {/* Today Summary */}
        {isMonthCreated && todayCounts && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm flex flex-wrap gap-3 items-center shrink-0">
            <div className="font-bold text-blue-900 mr-2 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Tổng hợp ca hôm nay ({today.toLocaleDateString('vi-VN')}):
            </div>
            <div className="bg-white px-3 py-1 rounded shadow-sm border border-gray-200">
              <span className="text-gray-500 text-sm">Tổng nhân sự: </span>
              <span className="font-bold">{todayCounts.totalEmployees}</span>
            </div>
            <div className="bg-white px-3 py-1 rounded shadow-sm border border-gray-200">
              <span className="text-gray-500 text-sm">Có lịch: </span>
              <span className="font-bold text-indigo-600">{todayCounts.totalScheduled}</span>
            </div>
            {shiftTypes.map(st => {
              const count = todayCounts.counts[st.id] || 0;
              if (count === 0) return null;
              return (
                <div key={st.id} className="bg-white px-3 py-1 rounded shadow-sm border" style={{ borderColor: st.text_color }}>
                  <span className="font-bold text-sm mr-1" style={{ color: st.text_color }}>Ca {st.code}:</span>
                  <span className="font-bold">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
`;

content = content.replace(
  `</div>
    );
  };`,
  summaryUI + "\n  };"
);

fs.writeFileSync(file, content, 'utf8');
console.log('OK');
