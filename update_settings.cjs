const fs = require('fs');
let content = fs.readFileSync('src/pages/InventorySettings.tsx', 'utf8');

// Add activeTab option
content = content.replace(
  /useState<'subsystems' \| 'requisitionTypes' \| 'costCodes' \| 'driveSettings' \| 'locations'>\('locations'\);/,
  "useState<'subsystems' | 'requisitionTypes' | 'costCodes' | 'driveSettings' | 'locations' | 'auditTemplates'>('locations');"
);

// Add Template State
const templateState = `
  // Audit Templates State
  const [auditTemplates, setAuditTemplates] = useState<{ id: string; name: string; description: string; item_ids: string[] }[]>([]);
  const [newAuditTemplate, setNewAuditTemplate] = useState({ name: '', description: '', item_ids: [] as string[] });
  const [editingTemplate, setEditingTemplate] = useState<{ id: string; name: string; description: string; item_ids: string[] } | null>(null);
  const [items, setItems] = useState<any[]>([]); // To lookup items
`;
content = content.replace(
  "  // Drive Settings State",
  templateState + "\n  // Drive Settings State"
);

// Fetch data
content = content.replace(
  /supabase\.from\('inventory_locations'\)\.select\('\*'\)\.order\('code'\)\n        \]\);/,
  `supabase.from('inventory_locations').select('*').order('code'),
          supabase.from('inventory_audit_templates').select('*'),
          supabase.from('inventory_items').select('id, code, name')
        ]);`
);
content = content.replace(
  /const \[subsystemsRes, reqTypesRes, costCodesRes, driveSettingsRes, locationsRes\] = await Promise\.all\(\[/,
  "const [subsystemsRes, reqTypesRes, costCodesRes, driveSettingsRes, locationsRes, auditTemplatesRes, itemsRes] = await Promise.all(["
);
content = content.replace(
  /if \(locationsRes\.data\) setLocations\(locationsRes\.data\);/g,
  "if (locationsRes.data) setLocations(locationsRes.data);\n        if (auditTemplatesRes && auditTemplatesRes.data) setAuditTemplates(auditTemplatesRes.data);\n        if (itemsRes && itemsRes.data) setItems(itemsRes.data);"
);

// Add Tab Button
const tabButton = `
          <button
            onClick={() => setActiveTab('auditTemplates')}
            className={\`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap \${
              activeTab === 'auditTemplates'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }\`}
          >
            DS Kiểm kê mẫu
          </button>
`;
content = content.replace(
  /<\/nav>\s*<\/div>\s*<\/div>\s*<div className="p-6">/,
  tabButton + '\n        </nav>\n      </div>\n    </div>\n    <div className="p-6">'
);

// Create Tab UI
const tabUI = `
        {activeTab === 'auditTemplates' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Thêm Danh Sách Mẫu</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Tên danh sách (Vd: Kiểm kê dụng cụ...)"
                  value={newAuditTemplate.name}
                  onChange={(e) => setNewAuditTemplate({ ...newAuditTemplate, name: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Mô tả..."
                  value={newAuditTemplate.description}
                  onChange={(e) => setNewAuditTemplate({ ...newAuditTemplate, description: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500 mb-2">Để thêm vật tư vào danh sách này, hiện tại bạn cần lấy ID vật tư. Tính năng nâng cao sẽ được cập nhật sau.</p>
                </div>
                <button
                  onClick={async () => {
                    if (!newAuditTemplate.name) return;
                    const { error } = await supabase.from('inventory_audit_templates').insert([newAuditTemplate]);
                    if (!error) {
                      setNewAuditTemplate({ name: '', description: '', item_ids: [] });
                      const { data } = await supabase.from('inventory_audit_templates').select('*');
                      if (data) setAuditTemplates(data);
                    }
                  }}
                  className="w-32 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus size={18} /> Thêm
                </button>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên danh sách</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mô tả</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số lượng VT</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {auditTemplates.map(t => (
                    <tr key={t.id}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{t.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{t.description}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{t.item_ids?.length || 0} mã</td>
                      <td className="px-6 py-4 text-right text-sm">
                        <button
                          onClick={async () => {
                            if (!window.confirm('Xóa template này?')) return;
                            await supabase.from('inventory_audit_templates').delete().eq('id', t.id);
                            setAuditTemplates(auditTemplates.filter(x => x.id !== t.id));
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
`;

content = content.replace(
  /\{activeTab === 'locations' && \([\s\S]*?\)\}\n\s*<\/div>/,
  "$&" + "\n" + tabUI
);

fs.writeFileSync('src/pages/InventorySettings.tsx', content, 'utf8');
console.log('Updated InventorySettings.tsx');
