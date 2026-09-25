const fs = require('fs');
const file = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace searchTerm with selectedEmpId
content = content.replace(
  `const [searchTerm, setSearchTerm] = useState('');`,
  `const [selectedEmpId, setSelectedEmpId] = useState('');\n  const [selectedSummaryShiftId, setSelectedSummaryShiftId] = useState<string | null>(null);`
);

// Replace filteredEmployees logic
const oldFilter = `  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return employees;
    const lower = searchTerm.toLowerCase();
    return employees.filter(e => e.full_name.toLowerCase().includes(lower) || (e.role && e.role.toLowerCase().includes(lower)));
  }, [employees, searchTerm]);`;

const newFilter = `  const filteredEmployees = useMemo(() => {
    if (!selectedEmpId) return employees;
    return employees.filter(e => e.id === selectedEmpId);
  }, [employees, selectedEmpId]);`;

content = content.replace(oldFilter, newFilter);

// Replace the topBarSearch UI
const oldTopBarSearch = `<div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="TAm nhAn s..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>`;

const newTopBarSearch = `<div className="relative">
            <Users className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="pl-9 pr-8 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white cursor-pointer"
            >
              <option value="">-- Tất cả nhân sự --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.full_name} {emp.role ? \`(\${emp.role})\` : ''}</option>
              ))}
            </select>
          </div>`;

// Regex replace since the string contains utf-8 garbled chars from cat output
content = content.replace(/<div className="relative">\s*<Search[\s\S]*?<\/div>/m, newTopBarSearch);

// Replace Today's Summary Logic
const oldSummaryLogic = `  const todayCounts = useMemo(() => {
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
  }, [assignments, editedAssignments, filteredEmployees, isCurrentMonth, year, month, today]);`;

const newSummaryLogic = `  const todaySummary = useMemo(() => {
    if (!isCurrentMonth) return null;
    const dateStr = \`\${year}-\${month.toString().padStart(2, '0')}-\${today.getDate().toString().padStart(2, '0')}\`;
    const byShift: Record<string, string[]> = {};
    let totalScheduled = 0;
    
    // We compute summary based on ALL employees so it remains correct regardless of the filter, 
    // or maybe based on filteredEmployees? The user said "bên dưới bảng phân ca hãy thêm thẻ tổng hợp", 
    // typically summary applies to the whole team. Let's use \`employees\` instead of \`filteredEmployees\` for summary.
    employees.forEach(emp => {
      const sId = getShiftValue(emp.id, dateStr);
      if (sId) {
        if (!byShift[sId]) byShift[sId] = [];
        byShift[sId].push(emp.full_name);
        totalScheduled++;
      }
    });
    return { byShift, totalScheduled, totalEmployees: employees.length };
  }, [assignments, editedAssignments, employees, isCurrentMonth, year, month, today]);`;

content = content.replace(oldSummaryLogic, newSummaryLogic);

// Replace Today Summary UI
const oldSummaryUI = /\{\/\* Today Summary \*\/\}[\s\S]*?<\/div>\s*\)\}/m;

const newSummaryUI = `{/* Today Summary */}
        {isMonthCreated && todaySummary && (
          <div className="mt-4 flex flex-col gap-2 shrink-0">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-sm flex flex-wrap gap-3 items-center">
              <div className="font-bold text-blue-900 mr-2 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Tổng hợp ca hôm nay ({today.toLocaleDateString('vi-VN')}):
              </div>
              <div className="bg-white px-3 py-1 rounded shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50" onClick={() => setSelectedSummaryShiftId(null)}>
                <span className="text-gray-500 text-sm">Tổng nhân sự: </span>
                <span className="font-bold">{todaySummary.totalEmployees}</span>
              </div>
              <div className="bg-white px-3 py-1 rounded shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50" onClick={() => setSelectedSummaryShiftId('all')}>
                <span className="text-gray-500 text-sm">Có lịch: </span>
                <span className="font-bold text-indigo-600">{todaySummary.totalScheduled}</span>
              </div>
              {shiftTypes.map(st => {
                const names = todaySummary.byShift[st.id] || [];
                if (names.length === 0) return null;
                const isSelected = selectedSummaryShiftId === st.id;
                return (
                  <div 
                    key={st.id} 
                    onClick={() => setSelectedSummaryShiftId(isSelected ? null : st.id)}
                    className={\`bg-white px-3 py-1 rounded shadow-sm border cursor-pointer transition-colors \${isSelected ? 'ring-2 ring-offset-1' : 'hover:bg-gray-50'}\`} 
                    style={{ borderColor: st.text_color, ...(isSelected ? { ringColor: st.text_color } : {}) }}
                    title="Click để xem danh sách"
                  >
                    <span className="font-bold text-sm mr-1" style={{ color: st.text_color }}>Ca {st.code}:</span>
                    <span className="font-bold">{names.length}</span>
                  </div>
                );
              })}
            </div>
            
            {/* Display list of names for selected tag */}
            {selectedSummaryShiftId && (
              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm animate-fade-in text-sm flex flex-wrap gap-2">
                <span className="font-bold text-gray-700 mr-2">
                  {selectedSummaryShiftId === 'all' 
                    ? 'Nhân sự có lịch hôm nay:' 
                    : \`Nhân sự làm Ca \${shiftTypes.find(t => t.id === selectedSummaryShiftId)?.code}:\`}
                </span>
                
                {selectedSummaryShiftId === 'all' 
                  ? Object.values(todaySummary.byShift).flat().map((name, i) => (
                      <span key={i} className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">{name}</span>
                    ))
                  : (todaySummary.byShift[selectedSummaryShiftId] || []).map((name, i) => (
                      <span key={i} className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full border" style={{ borderColor: shiftTypes.find(t => t.id === selectedSummaryShiftId)?.text_color }}>
                        {name}
                      </span>
                    ))
                }
              </div>
            )}
          </div>
        )}`;

content = content.replace(oldSummaryUI, newSummaryUI);

fs.writeFileSync(file, content, 'utf8');
console.log('OK');
