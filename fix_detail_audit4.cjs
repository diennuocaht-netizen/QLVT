const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/DetailAuditModal.tsx', 'utf8');

const searchHtml = `
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h3 className="font-semibold text-gray-800 text-lg mb-4 sm:mb-0 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
              Chi tiết vật tư kiểm kê
            </h3>
            <div className="w-full sm:w-64 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm kiếm vật tư..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          <div className="overflow-x-auto rounded-lg border border-gray-200">
`;

// First remove the old header block again just in case (the previous script might have failed due to mangled text)
// We already know it might have been mangled into `Chi ti?t v?t tu ki?m k`
content = content.replace(/<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">[\s\S]*?<\/div>\s*<div className="overflow-x-auto rounded-lg border border-gray-200">/, searchHtml);

content = content.replace(/<div className="overflow-x-auto rounded-lg border border-gray-200">/, searchHtml);

fs.writeFileSync('src/components/inventory/DetailAuditModal.tsx', content, 'utf8');
console.log('Added search input correctly');
