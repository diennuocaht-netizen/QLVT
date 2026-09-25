const fs = require('fs');
const file = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(file, 'utf8');

const startIdx = content.indexOf('<div className="flex bg-gray-100 p-1 rounded-md">');
const endIdx = content.indexOf('onClick={handleSave}');
const buttonEndIdx = content.indexOf('</button>', endIdx) + 9; // length of </button>

if (startIdx !== -1 && endIdx !== -1) {
  const replacement = `<div className="flex bg-gray-100 p-1 rounded-md">
              <button
                onClick={() => setViewMode('matrix')}
                className={\`px-3 py-1.5 flex items-center text-sm font-medium rounded-md \${viewMode === 'matrix' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}\`}
              >
                <LayoutGrid className="w-4 h-4 mr-2" /> Bảng
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={\`px-3 py-1.5 flex items-center text-sm font-medium rounded-md \${viewMode === 'calendar' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}\`}
              >
                <Calendar className="w-4 h-4 mr-2" /> Lịch
              </button>
            </div>
          </div>
          
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
          
          <div className="flex space-x-2 text-xs">
            {canEdit && (
              <>
                <input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleImportExcel} 
                />
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
                
                <button
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
  
  content = content.substring(0, startIdx) + replacement + content.substring(buttonEndIdx);
  fs.writeFileSync(file, content, 'utf8');
  console.log('REPLACED');
} else {
  console.log('NOT FOUND');
}
