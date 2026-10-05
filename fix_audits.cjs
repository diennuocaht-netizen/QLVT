const fs = require('fs');
let content = fs.readFileSync('src/pages/InventoryAudits.tsx', 'utf8');

content = content.replace(
  /<div className="flex justify-between items-center">[\s\S]*?<\/button>\s*<\/div>/,
  `<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 whitespace-nowrap">Kiểm Kê Kho</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm w-full md:w-auto"
        >
          <Plus size={18} /> Tạo Phiếu Kiểm Kê
        </button>
      </div>`
);

fs.writeFileSync('src/pages/InventoryAudits.tsx', content, 'utf8');
console.log('Fixed Audits');
