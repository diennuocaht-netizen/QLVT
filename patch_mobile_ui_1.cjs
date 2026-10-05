const fs = require('fs');

function patchFile(filename, replacements) {
  let content = fs.readFileSync(filename, 'utf8');
  let changed = false;
  for (const { regex, replacement } of replacements) {
    if (regex.test(content)) {
      content = content.replace(regex, replacement);
      changed = true;
    } else {
      console.log(`Regex not matched in ${filename}: ${regex}`);
    }
  }
  if (changed) {
    fs.writeFileSync(filename, content, 'utf8');
    console.log(`Patched ${filename}`);
  }
}

// 1. InventoryItems.tsx
patchFile('src/pages/InventoryItems.tsx', [
  {
    // Hide top buttons on mobile
    regex: /<div className="flex flex-wrap gap-2 w-full md:w-auto">/,
    replacement: '<div className="flex flex-wrap gap-2 w-full md:w-auto">\n            {/* Mobile Actions */}'
  },
  {
    regex: /<button\s+onClick=\{\(\) => setIsGlobalQRScannerOpen\(true\)\}\s+className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"\s*>\s*<ScanLine size=\{20\} \/> QuAct mA QR\s*<\/button>/g,
    replacement: `<button
              onClick={() => setIsGlobalQRScannerOpen(true)}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm"
            >
              <ScanLine size={20} /> Quét mã QR
            </button>`
  },
  {
    regex: /<button\s+onClick=\{\(\) => document\.getElementById\('file-upload'\)\?\.click\(\)\}\s+disabled=\{importing\}\s+className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-sm disabled:opacity-50"\s*>\s*<Upload size=\{20\} \/> \{importing \? '\?ang nh-p\.\.\.' : 'Nh-p Excel'\}\s*<\/button>/g,
    replacement: `<button
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={importing}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-sm disabled:opacity-50"
            >
              <Upload size={20} /> {importing ? 'Đang nhập...' : 'Nhập Excel'}
            </button>`
  },
  {
    regex: /<button\s+onClick=\{handleExportExcel\}\s+className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm"\s*>\s*<Download size=\{20\} \/> Xut Excel\s*<\/button>/g,
    replacement: `<button
              onClick={handleExportExcel}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-sm"
            >
              <Download size={20} /> Xuất Excel
            </button>`
  },
  {
    regex: /<button\s+onClick=\{\(\) => \{\s*setEditingItem\(null\);\s*setIsModalOpen\(true\);\s*\}\}\s+className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"\s*>\s*<Plus size=\{20\} \/> ThAm V-t T\s*<\/button>/g,
    replacement: `<button
              onClick={() => {
                setEditingItem(null);
                setIsModalOpen(true);
              }}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm"
            >
              <Plus size={20} /> Thêm Vật Tư
            </button>`
  },
  // Fix action buttons in Mobile Cards
  {
    regex: /<div className="flex justify-between gap-1 border-t pt-3">[\s\S]*?<\/div>\s*<\/div>\s*\)\)\s*\)}/g,
    replacement: `<div className="flex gap-2 border-t pt-3">
                      <button onClick={() => { setQuickIssueItem(inv.item); setQuickIssueOpen(true); }} className="flex-1 flex justify-center items-center gap-2 py-2.5 text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-lg font-medium text-sm transition-colors border border-yellow-200">
                        <ZapOff size={18} /> Xuất
                      </button>
                      <button onClick={() => { setPrintQRItem(inv.item); setPrintQROpen(true); }} className="flex-1 flex justify-center items-center py-2.5 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200">
                        <QrCode size={18} />
                      </button>
                      <button onClick={() => { setTraceabilityItem(inv.item); setTraceabilityOpen(true); }} className="flex-1 flex justify-center items-center py-2.5 text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
                        <Layers size={18} />
                      </button>
                      <button onClick={() => { setEditingItem(inv.item); setIsModalOpen(true); }} className="flex-1 flex justify-center items-center py-2.5 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDeleteClick(inv.item.id)} className="flex-1 flex justify-center items-center py-2.5 text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}`
  }
]);

