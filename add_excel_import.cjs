const fs = require('fs');
let content = fs.readFileSync('src/pages/InventorySettings.tsx', 'utf8');

const importExcelLogic = `
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        className="hidden"
                        id="import-template-excel"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          const reader = new FileReader();
                          reader.onload = async (evt) => {
                            try {
                              const bstr = evt.target?.result;
                              const wb = XLSX.read(bstr, { type: 'binary' });
                              const wsname = wb.SheetNames[0];
                              const ws = wb.Sheets[wsname];
                              const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
                              
                              // Flatten all cells to a set of strings to find matching codes
                              const allCells = new Set<string>();
                              rawData.forEach(row => {
                                row.forEach(cell => {
                                  if (cell !== null && cell !== undefined) {
                                    allCells.add(cell.toString().trim());
                                  }
                                });
                              });
                              
                              // Find matching items
                              const matchedItems = items.filter(i => allCells.has(i.code));
                              const matchedIds = matchedItems.map(i => i.id);
                              
                              if (matchedIds.length === 0) {
                                alert('Không tìm thấy mã vật tư nào hợp lệ trong file Excel.');
                                return;
                              }
                              
                              // Avoid duplicates
                              const currentIds = editingTemplate.item_ids || [];
                              const newIdsToAppend = matchedIds.filter(id => !currentIds.includes(id));
                              
                              if (newIdsToAppend.length === 0) {
                                alert('Các vật tư trong file Excel đều đã có trong danh sách mẫu này.');
                                return;
                              }
                              
                              const newIds = [...currentIds, ...newIdsToAppend];
                              
                              const { error } = await supabase.from('inventory_audit_templates').update({ item_ids: newIds }).eq('id', editingTemplate.id);
                              if (!error) {
                                setEditingTemplate({ ...editingTemplate, item_ids: newIds });
                                setAuditTemplates(auditTemplates.map(t => t.id === editingTemplate.id ? { ...t, item_ids: newIds } : t));
                                alert(\`Đã thêm thành công \${newIdsToAppend.length} vật tư từ file Excel.\`);
                              }
                            } catch (err) {
                              console.error(err);
                              alert('Lỗi khi đọc file Excel');
                            }
                          };
                          reader.readAsBinaryString(file);
                          e.target.value = ''; // Reset input
                        }}
                      />
                      <button
                        onClick={() => document.getElementById('import-template-excel')?.click()}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap flex items-center gap-2"
                        title="Import file Excel chứa Mã VT"
                      >
                        <Upload size={18} /> Nhập từ Excel
                      </button>
`;

content = content.replace(
  /className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 whitespace-nowrap"\s*>\s*Thêm vào mẫu\s*<\/button>\s*<\/div>/,
  "$&" + "\n" + importExcelLogic
);

fs.writeFileSync('src/pages/InventorySettings.tsx', content, 'utf8');
console.log('Added Excel import logic to Template Modal');
