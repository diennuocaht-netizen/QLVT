const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/AuditModal.tsx', 'utf8');

const itemOptionsCode = `
  const itemOptions = allItems
    .filter(l => !auditLines.some(al => al.item.id === l.item.id))
    .map(l => ({
      value: l.item.id,
      label: \`\${l.item.code} - \${l.item.name} (Tồn HT: \${l.systemStock})\`
    }));
`;

content = content.replace(
  /const filteredLines = auditLines/,
  itemOptionsCode + '\n  const filteredLines = auditLines'
);

const selectHtml = `
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Thêm vật tư vào phiếu kiểm kê</label>
              <Select
                options={itemOptions}
                onChange={(selected: any) => {
                  if (selected) {
                    const line = allItems.find(l => l.item.id === selected.value);
                    if (line) {
                      setAuditLines([...auditLines, { ...line, actualStock: line.systemStock, difference: 0 }]);
                    }
                  }
                }}
                value={null}
                placeholder="-- Tìm và chọn vật tư... --"
                isSearchable
                noOptionsMessage={() => 'Không tìm thấy vật tư'}
                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                menuPortalTarget={document.body}
              />
            </div>
`;

content = content.replace(
  /<div className="mb-4 flex flex-col md:flex-row gap-4 items-center justify-between">/,
  selectHtml + '\n            <div className="mb-4 flex flex-col md:flex-row gap-4 items-center justify-between">'
);

fs.writeFileSync('src/components/inventory/AuditModal.tsx', content, 'utf8');
console.log('Added Select UI');
