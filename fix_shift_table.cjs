const fs = require('fs');

const filename = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(filename, 'utf8');

// Hide STT
content = content.replace(/<th className="border border-gray-300 p-2 text-center bg-gray-50 w-8">STT<\/th>/g, '<th className="hidden md:table-cell border border-gray-300 p-2 text-center bg-gray-50 w-8">STT</th>');
content = content.replace(/<td className="border border-gray-300 p-2 text-center font-medium">\{idx \+ 1\}<\/td>/g, '<td className="hidden md:table-cell border border-gray-300 p-2 text-center font-medium">{idx + 1}</td>');

// Hide Chức danh
content = content.replace(/<th className="border border-gray-300 p-2 text-left bg-gray-50 w-36 md:w-40">/g, '<th className="hidden md:table-cell border border-gray-300 p-2 text-left bg-gray-50 w-36 md:w-40">');
content = content.replace(/<td className="border border-gray-300 p-0 text-xs" style=\{\{ backgroundColor: teamColor !== 'transparent' \? teamColor : '#fff' \}\}>/g, '<td className="hidden md:table-cell border border-gray-300 p-0 text-xs" style={{ backgroundColor: teamColor !== \'transparent\' ? teamColor : \'#fff\' }}>');

// Rename/Hide Stats Columns TH
content = content.replace(/<th className="border border-gray-300 p-2 text-center bg-gray-100 w-12 text-xs">/g, '<th className="hidden md:table-cell border border-gray-300 p-2 text-center bg-gray-100 w-12 text-xs">');
content = content.replace(/<th className="border border-gray-300 p-2 text-center bg-red-100 text-red-800 w-12 text-xs font-bold">/g, '<th className="hidden md:table-cell border border-gray-300 p-2 text-center bg-red-100 text-red-800 w-12 text-xs font-bold">');
content = content.replace(/<th className="border border-gray-300 p-2 text-center bg-gray-50 w-16">/g, '<th className="hidden md:table-cell border border-gray-300 p-2 text-center bg-gray-50 w-16">');
content = content.replace(/<th className="border border-gray-300 p-2 text-center bg-gray-50 w-10">/g, '<th className="hidden md:table-cell border border-gray-300 p-2 text-center bg-gray-50 w-10">'); // For the empty TH at the end

// Stats Columns TD
content = content.replace(/<td className="border border-gray-300 p-2 text-center font-bold bg-gray-50">/g, '<td className="hidden md:table-cell border border-gray-300 p-2 text-center font-bold bg-gray-50">');
content = content.replace(/<td className="border border-gray-300 p-2 text-center font-bold bg-red-50 text-red-600">/g, '<td className="hidden md:table-cell border border-gray-300 p-2 text-center font-bold bg-red-50 text-red-600">');
content = content.replace(/<td className="border border-gray-300 p-1 text-center">/g, '<td className="hidden md:table-cell border border-gray-300 p-1 text-center">');
content = content.replace(/<td className="border border-gray-300 p-1 text-center bg-gray-50">/g, '<td className="hidden md:table-cell border border-gray-300 p-1 text-center bg-gray-50">');

// Adjust width of "Họ và tên" on mobile
content = content.replace(/w-40 md:w-48 sticky left-0 z-20/g, 'w-24 min-w-[6rem] md:w-48 sticky left-0 z-20 shadow-[1px_0_0_0_rgba(209,213,219,1)] md:shadow-none');

fs.writeFileSync(filename, content, 'utf8');
console.log('Fixed ShiftSchedule table');
