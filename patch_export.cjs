const fs = require('fs');
let content = fs.readFileSync('src/pages/HRTaskLog.tsx', 'utf8');

// 1. Add XLSX import and Download icon
if (!content.includes('import * as XLSX')) {
    content = content.replace(
        "import { Calendar as CalendarIcon",
        "import * as XLSX from 'xlsx';\nimport { Calendar as CalendarIcon"
    );
    content = content.replace(
        "Layers, CheckCircle } from 'lucide-react';",
        "Layers, CheckCircle, Download, Filter } from 'lucide-react';"
    );
}

// 2. Add state for selectedSubsystem
if (!content.includes('selectedSubsystem')) {
    content = content.replace(
        "const [searchTerm, setSearchTerm] = useState('');",
        "const [searchTerm, setSearchTerm] = useState('');\n  const [selectedSubsystem, setSelectedSubsystem] = useState('all');"
    );
}

// 3. Update filteredLogs logic
const oldFilteredLogs = /const filteredLogs = logs\.filter\(log =>[\s\S]*?\);/m;
const newFilteredLogs = `const uniqueSubsystems = Array.from(new Set(logs.map(l => l.subsystem_name)));

  const filteredLogs = logs.filter(log => {
    const matchSearch = log.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.subsystem_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.completers.join(', ')).toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchSubsystem = selectedSubsystem === 'all' || log.subsystem_name === selectedSubsystem;
    
    return matchSearch && matchSubsystem;
  });

  const handleExportExcel = () => {
    if (filteredLogs.length === 0) {
      alert('Không có dữ liệu để xuất!');
      return;
    }
    const exportData = filteredLogs.map((log, index) => ({
      'STT': index + 1,
      'Công việc': log.title,
      'Phân hệ': log.subsystem_name,
      'Người giao': log.assigner,
      'Ngày giao': new Date(log.assigned_at).toLocaleString('vi-VN'),
      'Nội dung yêu cầu': log.original_description,
      'Người phụ trách': log.assignee,
      'Người hoàn thành': log.completers.join(', '),
      'Ngày hoàn thành': new Date(log.completed_at).toLocaleString('vi-VN'),
      'Kết quả / Ghi chú': log.completion_note
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    
    const wscols = [
      {wch: 5}, {wch: 30}, {wch: 20}, {wch: 20}, {wch: 20}, {wch: 40}, {wch: 20}, {wch: 30}, {wch: 20}, {wch: 40}
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "NhatKyCongViec");
    XLSX.writeFile(wb, \`NhatKyCongViec_\${startDate}_to_\${endDate}.xlsx\`);
  };`;
  
if (!content.includes('uniqueSubsystems')) {
    content = content.replace(oldFilteredLogs, newFilteredLogs);
}

// 4. Update UI to add Export Button and Subsystem filter dropdown
const uiToReplace = `<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 shrink-0 flex flex-wrap gap-4 items-end">`;
const newUi = `<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 shrink-0 flex flex-wrap gap-4 items-end justify-between">
        <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Từ ngày</label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-medium text-gray-900 w-40"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Đến ngày</label>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-medium text-gray-900 w-40"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Lọc phân hệ</label>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={selectedSubsystem}
              onChange={(e) => setSelectedSubsystem(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-medium text-gray-900 w-48 appearance-none bg-white"
            >
              <option value="all">Tất cả phân hệ</option>
              {uniqueSubsystems.map((ss, i) => (
                <option key={i} value={ss as string}>{ss as string}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="w-64">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Tìm kiếm</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm theo tên việc, người làm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        </div>
        <button
          onClick={handleExportExcel}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm font-medium"
        >
          <Download className="w-4 h-4 mr-2" />
          Xuất Excel
        </button>
      </div>`;
      
// Remove the old div structure up to the end of search term div
const fullOldUiRegex = /<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 shrink-0 flex flex-wrap gap-4 items-end">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/m;
if (content.match(fullOldUiRegex)) {
    content = content.replace(fullOldUiRegex, newUi);
    fs.writeFileSync('src/pages/HRTaskLog.tsx', content, 'utf8');
    console.log('HRTaskLog patched with Export and Filter');
} else {
    console.log('Failed to match UI Regex');
}

