const fs = require('fs');
let content = fs.readFileSync('src/pages/InventorySettings.tsx', 'utf8');

// Add selectedItemsToAdd state
if (!content.includes('const [selectedItemsToAdd, setSelectedItemsToAdd]')) {
  content = content.replace(
    "const [editingTemplate, setEditingTemplate]",
    "const [selectedItemsToAdd, setSelectedItemsToAdd] = useState<any[]>([]);\n    const [editingTemplate, setEditingTemplate]"
  );
}

// Ensure state is cleared when modal is closed
content = content.replace(
  "setEditingTemplate(null)",
  "{ setEditingTemplate(null); setSelectedItemsToAdd([]); }"
);

// Replace Select block
const selectBlockRegex = /<Select[\s\S]*?value=\{null\}\s*\/>/m;

const newSelectBlock = `<div className="flex gap-2">
                    <div className="flex-1">
                      <Select
                        isMulti
                        menuPosition="fixed"
                        options={items.filter(i => !editingTemplate.item_ids?.includes(i.id)).map(i => ({ value: i.id, label: \`\${i.code} - \${i.name}\` }))}
                        onChange={(selected: any) => setSelectedItemsToAdd(selected || [])}
                        placeholder="Tìm kiếm và chọn nhiều vật tư..."
                        isSearchable
                        value={selectedItemsToAdd}
                      />
                    </div>
                    <button
                      onClick={async () => {
                        if (selectedItemsToAdd.length === 0) return;
                        const selectedIds = selectedItemsToAdd.map((opt: any) => opt.value);
                        const newIds = [...(editingTemplate.item_ids || []), ...selectedIds];
                        const { error } = await supabase.from('inventory_audit_templates').update({ item_ids: newIds }).eq('id', editingTemplate.id);
                        if (!error) {
                          setEditingTemplate({ ...editingTemplate, item_ids: newIds });
                          setAuditTemplates(auditTemplates.map(t => t.id === editingTemplate.id ? { ...t, item_ids: newIds } : t));
                          setSelectedItemsToAdd([]);
                        }
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 whitespace-nowrap"
                    >
                      Thêm vào mẫu
                    </button>
                  </div>`;

if (selectBlockRegex.test(content)) {
  content = content.replace(selectBlockRegex, newSelectBlock);
  fs.writeFileSync('src/pages/InventorySettings.tsx', content, 'utf8');
  console.log('Fixed Select block');
} else {
  console.log('Regex did not match');
}
