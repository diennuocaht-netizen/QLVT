const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/DetailAuditModal.tsx', 'utf8');

if (!content.includes("import { Search")) {
    content = content.replace(
        "import { X, FileText, Download } from 'lucide-react';",
        "import { X, FileText, Download, Search } from 'lucide-react';"
    );
}

// Replace the specific h3 line
content = content.replace(
    /<h3 className="font-semibold text-gray-800 text-lg mb-4 flex items-center gap-2">[\s\S]*?<\/h3>/,
    `<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h3 className="font-semibold text-gray-800 text-lg mb-4 sm:mb-0 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-indigo-500 rounded-full"></span>
              Chi ti?t v?t tu ki?m k
            </h3>
            <div className="w-full sm:w-64 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tm ki?m v?t tu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>`
);

// Add the filtered items logic before mapping
content = content.replace(
    /\{auditItems\.map\(\(item, index\)/,
    `{auditItems
                      .filter(item => {
                        if (!searchTerm) return true;
                        const s = searchTerm.toLowerCase();
                        const code = (getItemCode(item.itemId) || '').toLowerCase();
                        const name = (getItemName(item.itemId) || '').toLowerCase();
                        return code.includes(s) || name.includes(s);
                      })
                      .map((item, index)`
);

// Also apply the filter to the Excel export
content = content.replace(
    /const itemRows = auditItems\.map/,
    `const filteredAuditItems = auditItems.filter(item => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        const code = (getItemCode(item.itemId) || '').toLowerCase();
        const name = (getItemName(item.itemId) || '').toLowerCase();
        return code.includes(s) || name.includes(s);
    });
    
    const itemRows = filteredAuditItems.map`
);

fs.writeFileSync('src/components/inventory/DetailAuditModal.tsx', content, 'utf8');
console.log('Fixed detail audit search completely');
