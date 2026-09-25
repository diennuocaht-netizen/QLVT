const fs = require('fs');
const file = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Imports
content = content.replace(
  `import { Calendar, LayoutGrid, ChevronLeft, ChevronRight, Save, Plus, Users, Upload, Search, Trash2 } from 'lucide-react';`,
  `import { Calendar, LayoutGrid, ChevronLeft, ChevronRight, Save, Plus, Users, Upload, Search, Trash2, X, RotateCcw, CheckSquare } from 'lucide-react';\nimport { logActivity } from '../utils/activityLogger';`
);

// 2. States
const stateDecls = `  const [selectedSummaryShiftId, setSelectedSummaryShiftId] = useState<string | null>(null);`;
const newStates = `  const [selectedSummaryShiftId, setSelectedSummaryShiftId] = useState<string | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [bulkDate, setBulkDate] = useState<string>('');
  const [bulkShift, setBulkShift] = useState<string>('');`;

if (!content.includes('selectedRowIds')) {
  content = content.replace(stateDecls, newStates);
}

// 3. handleDiscard and bulk handlers
const handlers = `
  const handleDiscard = () => {
    if (window.confirm('Bạn có chắc chắn muốn bỏ qua tất cả các thay đổi chưa lưu?')) {
      setEditedAssignments({});
      setEditedEmployees({});
      setSelectedRowIds([]);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRowIds(filteredEmployees.map(emp => emp.id));
    } else {
      setSelectedRowIds([]);
    }
  };

  const handleSelectRow = (empId: string) => {
    setSelectedRowIds(prev => 
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  const handleApplyBulk = () => {
    if (selectedRowIds.length === 0 || !bulkDate || !bulkShift) return;
    setEditedAssignments(prev => {
      const next = { ...prev };
      selectedRowIds.forEach(empId => {
        if (!next[empId]) next[empId] = {};
        next[empId][bulkDate] = bulkShift === 'clear' ? '' : bulkShift;
      });
      return next;
    });
    alert(\`Đã áp dụng thay đổi cho \${selectedRowIds.length} nhân sự!\`);
  };
`;

if (!content.includes('handleApplyBulk')) {
  content = content.replace(
    `const handleShiftChange = (empId: string, dateStr: string, shiftTypeId: string) => {`,
    handlers + `\n  const handleShiftChange = (empId: string, dateStr: string, shiftTypeId: string) => {`
  );
}

// 4. logActivity inside handleSave
const oldSaveSuccess = `          // Merge edited back to assignments`;
const newSaveSuccess = `          // Log activity
          await logActivity({
            action: 'Phân ca làm việc',
            details: { message: \`Đã thay đổi (\${upserts.length} gán mới/cập nhật, \${deletes.length} xóa) ca làm việc.\` }
          });
          
          // Merge edited back to assignments`;
if (!content.includes('action: \'Phân ca làm việc\'')) {
  content = content.replace(oldSaveSuccess, newSaveSuccess);
}

// 5. Buttons (Discard button)
const oldButtons = `<button
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges || saving}
                  className={\`px-4 py-2 rounded-md flex items-center shadow-sm font-medium \${hasUnsavedChanges ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}\`}
                >
                  {saving ? <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save className="w-4 h-4 mr-2" />}
                  Lu thay \` i
                </button>`;
// Replace with regex to avoid encoding issues
const buttonRegex = /<button[\s\S]*?onClick=\{handleSave\}[\s\S]*?L.u thay[\s\S]*?<\/button>/;

const newButtons = `<button
                  onClick={handleDiscard}
                  disabled={!hasUnsavedChanges || saving}
                  className={\`px-3 py-1.5 rounded-md flex items-center text-sm font-medium \${hasUnsavedChanges ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed hidden'}\`}
                  title="Bỏ qua các thay đổi chưa lưu"
                >
                  <RotateCcw className="w-4 h-4 mr-1.5" />
                  Hủy thay đổi
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges || saving}
                  className={\`px-4 py-1.5 rounded-md flex items-center text-sm shadow-sm font-medium \${hasUnsavedChanges ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}\`}
                >
                  {saving ? <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save className="w-4 h-4 mr-1.5" />}
                  Lưu thay đổi
                </button>`;

if (!content.includes('handleDiscard')) {
  // It was already added to handlers, but let's check UI
}
content = content.replace(buttonRegex, newButtons);

// 6. Bulk Action UI
const oldTopControls = `<div className="flex space-x-2 text-xs">`;
const bulkUI = `
          {selectedRowIds.length > 0 && canEdit && (
            <div className="flex items-center space-x-2 bg-indigo-50 px-3 py-1.5 rounded-md border border-indigo-200 shadow-sm animate-fade-in mr-4">
              <span className="text-xs text-indigo-800 font-bold flex items-center">
                <CheckSquare className="w-4 h-4 mr-1" />
                Đã chọn {selectedRowIds.length}
              </span>
              <select className="text-xs border border-indigo-200 rounded px-1 py-1" value={bulkDate} onChange={e => setBulkDate(e.target.value)}>
                <option value="">-- Ngày --</option>
                {days.map(d => <option key={d.dateStr} value={d.dateStr}>{d.dayNum}/{month}</option>)}
              </select>
              <select className="text-xs border border-indigo-200 rounded px-1 py-1" value={bulkShift} onChange={e => setBulkShift(e.target.value)}>
                <option value="">-- Ca --</option>
                {shiftTypes.map(st => <option key={st.id} value={st.id}>{st.code}</option>)}
                <option value="clear" className="text-red-500 font-bold">Xóa ca (Trống)</option>
              </select>
              <button 
                onClick={handleApplyBulk}
                disabled={!bulkDate || !bulkShift}
                className="px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors shadow-sm font-medium"
              >
                Áp dụng
              </button>
            </div>
          )}
          <div className="flex space-x-2 text-xs">`;

content = content.replace(oldTopControls, bulkUI);


// 7. Table headers & rows (check boxes)
const oldThead = `<th className="border border-gray-300 p-2 text-center bg-gray-50 w-10">STT</th>`;
const newThead = `<th className="border border-gray-300 p-1 text-center bg-gray-50 w-8">
                      {canEdit && (
                        <input 
                          type="checkbox" 
                          className="rounded text-indigo-600 focus:ring-indigo-500" 
                          checked={selectedRowIds.length === filteredEmployees.length && filteredEmployees.length > 0} 
                          onChange={handleSelectAll} 
                        />
                      )}
                    </th>
                    <th className="border border-gray-300 p-2 text-center bg-gray-50 w-8">STT</th>`;
content = content.replace(oldThead, newThead);

const oldTrData = `<td className="border border-gray-300 p-2 text-center font-medium bg-gray-50">{idx + 1}</td>`;
const newTrData = `<td className="border border-gray-300 p-1 text-center bg-white cursor-pointer" onClick={() => canEdit && handleSelectRow(emp.id)}>
                            {canEdit && (
                              <input 
                                type="checkbox" 
                                className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                checked={selectedRowIds.includes(emp.id)}
                                onChange={() => handleSelectRow(emp.id)}
                                onClick={e => e.stopPropagation()}
                              />
                            )}
                          </td>
                          <td className="border border-gray-300 p-2 text-center font-medium bg-gray-50">{idx + 1}</td>`;
content = content.replace(oldTrData, newTrData);


fs.writeFileSync(file, content, 'utf8');
console.log('OK');
