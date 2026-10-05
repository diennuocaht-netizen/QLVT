const fs = require('fs');
const filename = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(filename, 'utf8');

// 1. Table columns
content = content.replace(/<th className="border border-gray-300 p-2 text-center bg-gray-50 w-8">STT<\/th>/g, '<th className="hidden md:table-cell border border-gray-300 p-2 text-center bg-gray-50 w-8">STT</th>');
content = content.replace(/<td className="border border-gray-300 p-2 text-center font-medium">\{idx \+ 1\}<\/td>/g, '<td className="hidden md:table-cell border border-gray-300 p-2 text-center font-medium">{idx + 1}</td>');

content = content.replace(/<th className="border border-gray-300 p-2 text-left bg-gray-50 w-36 md:w-40">/g, '<th className="hidden md:table-cell border border-gray-300 p-2 text-left bg-gray-50 w-36 md:w-40">');
content = content.replace(/<td className="border border-gray-300 p-0 text-xs" style=\{\{ backgroundColor: teamColor !== 'transparent' \? teamColor : '#fff' \}\}>/g, '<td className="hidden md:table-cell border border-gray-300 p-0 text-xs" style={{ backgroundColor: teamColor !== \'transparent\' ? teamColor : \'#fff\' }}>');

content = content.replace(/<th className="border border-gray-300 p-2 text-center bg-gray-100 w-12 text-xs">/g, '<th className="hidden md:table-cell border border-gray-300 p-2 text-center bg-gray-100 w-12 text-xs">');
content = content.replace(/<th className="border border-gray-300 p-2 text-center bg-red-100 text-red-800 w-12 text-xs font-bold">/g, '<th className="hidden md:table-cell border border-gray-300 p-2 text-center bg-red-100 text-red-800 w-12 text-xs font-bold">');
content = content.replace(/<th className="border border-gray-300 p-2 text-center bg-gray-50 w-16">/g, '<th className="hidden md:table-cell border border-gray-300 p-2 text-center bg-gray-50 w-16">');
content = content.replace(/<th className="border border-gray-300 p-2 text-center bg-gray-50 w-10">/g, '<th className="hidden md:table-cell border border-gray-300 p-2 text-center bg-gray-50 w-10">');

content = content.replace(/<td className="border border-gray-300 p-2 text-center font-bold bg-gray-50">/g, '<td className="hidden md:table-cell border border-gray-300 p-2 text-center font-bold bg-gray-50">');
content = content.replace(/<td className="border border-gray-300 p-2 text-center font-bold bg-red-50 text-red-600">/g, '<td className="hidden md:table-cell border border-gray-300 p-2 text-center font-bold bg-red-50 text-red-600">');
content = content.replace(/<td className="border border-gray-300 p-1 text-center">/g, '<td className="hidden md:table-cell border border-gray-300 p-1 text-center">');
content = content.replace(/<td className="border border-gray-300 p-1 text-center bg-gray-50">/g, '<td className="hidden md:table-cell border border-gray-300 p-1 text-center bg-gray-50">');

// 2. Họ và tên width
content = content.replace(/w-40 md:w-48 sticky left-0 z-20/g, 'w-32 min-w-[8rem] md:w-48 sticky left-0 z-20 shadow-[1px_0_0_0_rgba(209,213,219,1)] md:shadow-none');

// 3. Action buttons
content = content.replace(/<Upload className="w-4 h-4 mr-1.5" \/>\s*Nhập Excel/g, '<Upload className="w-4 h-4 sm:mr-1.5" />\n                    <span className="hidden sm:inline">Nhập Excel</span>');
content = content.replace(/<Users className="w-4 h-4 mr-1.5" \/>\s*Đồng bộ NS/g, '<Users className="w-4 h-4 sm:mr-1.5" />\n                    <span className="hidden sm:inline">Đồng bộ NS</span>');
content = content.replace(/<RotateCcw className="w-4 h-4 mr-1.5" \/>\s*Hủy thay đổi/g, '<RotateCcw className="w-4 h-4 sm:mr-1.5" />\n                    <span className="hidden sm:inline">Hủy thay đổi</span>');
content = content.replace(/<Save className="w-4 h-4 mr-1.5" \/>\s*Lưu thay đổi/g, '<Save className="w-4 h-4 sm:mr-1.5" />\n                    <span className="hidden sm:inline">Lưu thay đổi</span>');
content = content.replace(/px-3 py-1.5 rounded-md flex items-center text-sm font-medium/g, 'px-2 md:px-3 py-1.5 rounded-md flex items-center text-sm font-medium');
content = content.replace(/className="flex gap-2 shrink-0 flex-wrap"/g, 'className="flex gap-1.5 md:gap-2 shrink-0 flex-wrap"');

// 4. Hide shift legends wrapper
// Find the exact wrapper: <div className="flex flex-wrap gap-2 items-center">
content = content.replace(/<div className="flex flex-wrap gap-2 items-center">/g, '<div className="hidden md:flex flex-wrap gap-2 items-center">');

fs.writeFileSync(filename, content, 'utf8');
console.log('Fixed ShiftSchedule layout completely');
