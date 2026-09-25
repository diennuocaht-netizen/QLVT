const fs = require('fs');
const file = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `) : viewMode === 'matrix' ? (
          <div className="flex-1 overflow-auto">`;

const replaceStr = `) : !isMonthCreated ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm">
            <Calendar className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tháng {month}/{year} chưa có dữ liệu lịch</h3>
            <p className="text-gray-500 mb-6">Bạn cần khởi tạo lịch cho tháng này trước khi bắt đầu phân ca.</p>
            {canEdit && (
              <button
                onClick={() => setMonthCreatedState(prev => ({ ...prev, [monthKey]: true }))}
                className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 font-medium shadow-sm flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Khởi tạo lịch tháng {month}/{year}
              </button>
            )}
          </div>
        ) : viewMode === 'matrix' ? (
          <div className="flex-1 overflow-auto">`;

content = content.replace(targetStr, replaceStr);
fs.writeFileSync(file, content, 'utf8');
console.log('OK');
