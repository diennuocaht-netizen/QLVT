const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/ReconciliationModal.tsx', 'utf8');

// Replace the UI structure to make it unified
const uiRegex = /<div className="w-full md:w-64 flex flex-col justify-end space-y-2">[\s\S]*?<label className="block text-sm font-medium text-gray-700">Cách 2: Chọn danh sách vật tư mẫu<\/label>[\s\S]*?<\/div>/;
// Wait, because of encoding it might be better to replace from `<div className="w-full md:w-64` to `</div>`

const newUI = `
            <div className="w-full md:w-80 space-y-4">
              <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-lg">
                <label className="block text-sm font-medium text-indigo-900 mb-1">1. Lọc theo danh sách mẫu (Tùy chọn)</label>
                <Select
                  options={templates.map(t => ({ value: t.item_ids, label: t.name + (t.description ? \` - \${t.description}\` : '') }))}
                  onChange={(selected: any) => {
                    if (selected && selected.value) {
                      window.selectedTemplateIds = selected.value; // Store globally for file upload reference
                    } else {
                      window.selectedTemplateIds = null;
                    }
                  }}
                  placeholder="Chọn mẫu để lọc..."
                  isClearable
                />
              </div>

              <div className="flex flex-col space-y-2">
                <label className="block text-sm font-medium text-gray-700">2. Import số liệu từ Bravo</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Upload size={18} />
                  Import File Bravo
                </button>
              </div>
            </div>
          </div>
`;

// It's safer to use split or replace by string if regex fails due to encoding
content = content.replace(/<div className="w-full md:w-64 flex flex-col justify-end space-y-2">[\s\S]*?Hệ thống sẽ tự động tổng hợp số liệu nhập\/xuất trên App cho các vật tư này\.<\/p>\s*<\/div>/, newUI);
// Note: Some characters were messed up by previous script, let's just do a broad replace

fs.writeFileSync('src/components/inventory/ReconciliationModal.tsx', content, 'utf8');
