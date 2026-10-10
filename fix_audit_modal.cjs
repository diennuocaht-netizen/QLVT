const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/AuditModal.tsx', 'utf8');

// 1. Add templates state
if (!content.includes('const [templates, setTemplates]')) {
  content = content.replace(
    "const [notes, setNotes] = useState('');",
    "const [notes, setNotes] = useState('');\n  const [templates, setTemplates] = useState<any[]>([]);"
  );
}

// 2. Fetch templates
if (!content.includes('supabase.from(\'inventory_audit_templates\').select(')) {
  content = content.replace(
    "const { data: slipsData, error: slipsError } = await supabase.from('inventory_slips').select('*');",
    "const { data: slipsData, error: slipsError } = await supabase.from('inventory_slips').select('*');\n        const { data: tData } = await supabase.from('inventory_audit_templates').select('*');\n        if (tData) setTemplates(tData);"
  );
}

// 3. Add UI to select template
const templateUI = `
            {/* Template Selector */}
            {!audit && (
              <div className="mb-6 border border-indigo-100 bg-indigo-50/50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-indigo-900 mb-2">Tải danh sách từ mẫu cài đặt (Tùy chọn)</label>
                <div className="flex gap-2 items-center">
                  <div className="flex-1">
                    <Select
                      options={templates.map(t => ({ value: t.item_ids, label: t.name + (t.description ? \` - \${t.description}\` : '') }))}
                      onChange={(selected: any) => {
                        if (!selected || !selected.value) return;
                        const ids = selected.value as string[];
                        const newLines = ids.map(id => allItems.find(x => x.item.id === id)).filter(Boolean) as AuditItemLine[];
                        // Merge with existing but avoid duplicates
                        const currentIds = auditLines.map(x => x.item.id);
                        const linesToAdd = newLines.filter(x => !currentIds.includes(x.item.id));
                        setAuditLines([...auditLines, ...linesToAdd]);
                      }}
                      placeholder="Chọn danh sách mẫu..."
                      isClearable
                      value={null}
                    />
                  </div>
                </div>
              </div>
            )}
`;

if (!content.includes('Template Selector')) {
  content = content.replace(
    /<div className="mb-6 flex gap-4">/,
    templateUI + "\n            <div className=\"mb-6 flex gap-4\">"
  );
}

fs.writeFileSync('src/components/inventory/AuditModal.tsx', content, 'utf8');
console.log('Fixed AuditModal template selection');
