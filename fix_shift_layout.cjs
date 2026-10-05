const fs = require('fs');
const filename = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(filename, 'utf8');

const monthNav = `<div className="flex items-center space-x-2">
              <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-5 md:w-6 h-5 md:h-6 text-gray-600" /></button>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 whitespace-nowrap">Tháng {currentDate.getMonth() + 1} / {currentDate.getFullYear()}</h1>
              <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-full"><ChevronRight className="w-5 md:w-6 h-5 md:h-6 text-gray-600" /></button>
            </div>`;

// Replace H1
content = content.replace(/<h1 className="text-xl md:text-2xl font-bold text-gray-900 whitespace-nowrap">Phân ca làm việc<\/h1>/, monthNav);

// Hide paragraph on mobile
content = content.replace(/<p className="text-sm text-gray-500 mt-1">Quản lý lịch trực của nhân sự theo tháng<\/p>/, '<p className="hidden md:block text-sm text-gray-500 mt-1 ml-10">Quản lý lịch trực của nhân sự theo tháng</p>');

// Find the lower bar and replace
const lowerBarRegex = /<div className="flex items-center justify-between mb-4 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">[\s\S]*?<div className="flex items-center space-x-4">[\s\S]*?<\/div>\s*\{selectedRowIds\.length > 0 && canEdit && \(/;

const newLowerBar = `<div className={\`items-center justify-between mb-4 bg-white p-3 rounded-lg border border-gray-200 shadow-sm \${selectedRowIds.length > 0 ? 'flex flex-col md:flex-row gap-4' : 'hidden md:flex'}\`}>
          <div className="flex-1 w-full md:w-auto">
            {selectedRowIds.length > 0 && canEdit && (`;

content = content.replace(lowerBarRegex, newLowerBar);

// We need to wrap the Shift Legends in a div that is hidden on mobile so it doesn't show when bulk assign is active?
// No wait, if bulk assign is active, the entire box is visible. But the legends inside it should be hidden on mobile!
// Let's find the legend wrapper: `<div className="flex flex-wrap gap-1 md:gap-2 text-[10px] md:text-xs">`
content = content.replace(/<div className="flex flex-wrap gap-1 md:gap-2 text-\[10px\] md:text-xs">/, '<div className="hidden md:flex flex-wrap gap-1 md:gap-2 text-[10px] md:text-xs">');

fs.writeFileSync(filename, content, 'utf8');
console.log('Fixed ShiftSchedule layout');
