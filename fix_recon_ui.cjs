const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/ReconciliationModal.tsx', 'utf8');

const templateUI = `
            <div className="bg-gray-50 p-4 rounded-xl space-y-3">
              <label className="block text-sm font-medium text-gray-700">Cách 2: Chọn danh sách vật tư mẫu</label>
              <Select
                options={templates.map(t => ({ value: t.item_ids, label: t.name + (t.description ? \` - \${t.description}\` : '') }))}
                onChange={handleSelectTemplate}
                placeholder="Chọn danh sách mẫu..."
                isClearable
                value={null}
              />
              <p className="text-xs text-gray-500">Hệ thống sẽ tự động tổng hợp số liệu nhập/xuất trên App cho các vật tư này.</p>
            </div>
`;

content = content.replace(
  /<p className="text-xs text-gray-500 text-center">[\s\S]*?<\/p>\s*<\/div>\s*<\/div>/,
  "$&" + "\n" + templateUI
);

// Actually, wait, let's just do a substring replacement instead of regex if regex fails.
const parts = content.split('Ch?n kho?ng th?i gian tru?c khi import file.\n            </p>\n          </div>');
if (parts.length === 2) {
  content = parts[0] + 'Chọn khoảng thời gian trước khi import file.\n            </p>\n          </div>' + "\n" + templateUI + parts[1];
}

fs.writeFileSync('src/components/inventory/ReconciliationModal.tsx', content, 'utf8');
