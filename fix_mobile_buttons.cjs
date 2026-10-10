const fs = require('fs');
let content = fs.readFileSync('src/pages/InventoryAudits.tsx', 'utf8');

const oldMobileButtons = `<button onClick={() => { setSelectedAudit(audit); setIsDetailModalOpen(true); }} className="p-2 
text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md" title="Chi tit">
                      <FileText size={18} />
                    </button>`;

const newMobileButtons = `{(profile?.role === 'admin' || profile?.role === 'manager') && (
                      <>
                        <button onClick={() => { setEditAudit(audit); setIsModalOpen(true); }} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md" title="Chỉnh sửa">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDeleteAudit(audit.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-md" title="Xóa">
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                    <button onClick={() => { setSelectedAudit(audit); setIsDetailModalOpen(true); }} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md" title="Chi tiết">
                      <FileText size={18} />
                    </button>`;

// Replace carefully ignoring encoding glitches
const regex = /<button onClick=\{\(\) => \{ setSelectedAudit\(audit\); setIsDetailModalOpen\(true\); \}\} className="p-2\s+text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md" title="[^"]+">\s*<FileText size=\{18\} \/>\s*<\/button>/;

if (regex.test(content)) {
  content = content.replace(regex, newMobileButtons);
  fs.writeFileSync('src/pages/InventoryAudits.tsx', content, 'utf8');
  console.log('Fixed Mobile Buttons');
} else {
  console.log('Could not find mobile buttons to replace');
}
