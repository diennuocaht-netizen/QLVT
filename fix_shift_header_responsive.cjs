const fs = require('fs');

const filename = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(filename, 'utf8');

// 1. Fix wrapper for page title
content = content.replace(/<div className="flex justify-between items-center mb-6">/g, '<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">');

// 2. Fix wrapper for Month selector & action buttons
content = content.replace(/<div className="flex items-center justify-between mb-4 bg-white p-3/g, '<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4 bg-white p-3');

// 3. Fix Họ và tên width
content = content.replace(/<th className="border border-gray-300 p-2 text-left bg-gray-50 w-48 sticky left-0 z-20">/g, '<th className="border border-gray-300 p-2 text-left bg-gray-50 min-w-[120px] w-32 md:w-48 sticky left-0 z-20 shadow-[1px_0_0_0_rgba(209,213,219,1)] md:shadow-none">');

// 4. Fix Chức danh th to be hidden on mobile
content = content.replace(/<th className="border border-gray-300 p-2 text-left bg-gray-50 w-40">/g, '<th className="hidden md:table-cell border border-gray-300 p-2 text-left bg-gray-50 w-40">');

// 5. In case Chức danh `th` was slightly different:
content = content.replace(/<th className="border border-gray-300 p-2 text-left bg-gray-50 w-36 md:w-40">/g, '<th className="hidden md:table-cell border border-gray-300 p-2 text-left bg-gray-50 w-36 md:w-40">');

fs.writeFileSync(filename, content, 'utf8');
console.log('Fixed ShiftSchedule layout and table headers');
