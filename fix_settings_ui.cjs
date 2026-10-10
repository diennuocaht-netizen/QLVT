const fs = require('fs');
let content = fs.readFileSync('src/pages/InventorySettings.tsx', 'utf8');

const regex = /\{activeTab === 'auditTemplates' && \([\s\S]*?<div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">[\s\S]*?<h2 className="text-lg font-semibold text-gray-900 mb-4">Thêm Danh Sách Mẫu<\/h2>[\s\S]*?<\/div>\s*<\/div>\s*\)\}/;

const newUI = `{activeTab === 'auditTemplates' && (
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
                      <td className="px-6 py-4 text-right text-sm flex justify-end gap-3">
                        <button
                          onClick={() => setEditingTemplate(t)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Sửa danh sách vật tư"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={async () => {
                            if (!window.confirm('Xóa template này?')) return;
                            await supabase.from('inventory_audit_templates').delete().eq('id', t.id);
                            setAuditTemplates(auditTemplates.filter(x => x.id !== t.id));
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Xóa template"
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
        )}`;

if (regex.test(content)) {
  content = content.replace(regex, newUI);
} else {
  console.log('Regex did not match UI block');
}

// Add the editing modal for templates
const editingModal = `
      {editingTemplate && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold">Quản lý vật tư: {editingTemplate.name}</h2>
              <button onClick={() => setEditingTemplate(null)} className="p-2 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 flex-1 overflow-auto">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Thêm vật tư vào mẫu</label>
                <Select
                  options={items.filter(i => !editingTemplate.item_ids?.includes(i.id)).map(i => ({ value: i.id, label: \`\${i.code} - \${i.name}\` }))}
                  onChange={async (selected: any) => {
                    if (!selected) return;
                    const newIds = [...(editingTemplate.item_ids || []), selected.value];
                    const { error } = await supabase.from('inventory_audit_templates').update({ item_ids: newIds }).eq('id', editingTemplate.id);
                    if (!error) {
                      setEditingTemplate({ ...editingTemplate, item_ids: newIds });
                      setAuditTemplates(auditTemplates.map(t => t.id === editingTemplate.id ? { ...t, item_ids: newIds } : t));
                    }
                  }}
                  placeholder="Tìm kiếm vật tư..."
                  isSearchable
                  value={null}
                />
              </div>
              
              <div className="mt-6 border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 font-semibold text-gray-900 border-b">Mã VT</th>
                      <th className="p-3 font-semibold text-gray-900 border-b">Tên vật tư</th>
                      <th className="p-3 font-semibold text-gray-900 border-b text-center w-20">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(editingTemplate.item_ids || []).map(id => {
                      const item = items.find(i => i.id === id);
                      if (!item) return null;
                      return (
                        <tr key={id} className="hover:bg-gray-50">
                          <td className="p-3 font-medium text-indigo-600">{item.code}</td>
                          <td className="p-3 text-gray-700">{item.name}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={async () => {
                                const newIds = editingTemplate.item_ids.filter(i => i !== id);
                                await supabase.from('inventory_audit_templates').update({ item_ids: newIds }).eq('id', editingTemplate.id);
                                setEditingTemplate({ ...editingTemplate, item_ids: newIds });
                                setAuditTemplates(auditTemplates.map(t => t.id === editingTemplate.id ? { ...t, item_ids: newIds } : t));
                              }}
                              className="text-red-500 hover:bg-red-50 p-1 rounded"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {(editingTemplate.item_ids || []).length === 0 && (
                      <tr>
                        <td colSpan={3} className="p-6 text-center text-gray-500">Chưa có vật tư nào trong mẫu này.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace(
  /\n\s*<\/div>\n\s*<\/div>\n\s*<\/div>\n\s*\);\n\};\n?$/,
  "\n" + editingModal + "\n      </div>\n    </div>\n    </div>\n  );\n};\n"
);

fs.writeFileSync('src/pages/InventorySettings.tsx', content, 'utf8');
console.log('Fixed Template Editing UI in InventorySettings');
