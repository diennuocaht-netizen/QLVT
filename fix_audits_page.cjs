const fs = require('fs');
let content = fs.readFileSync('src/pages/InventoryAudits.tsx', 'utf8');

// Import Edit2, Trash2 if missing
if (!content.includes('Edit2')) {
  content = content.replace(
    "import { Plus, Search, FileText } from 'lucide-react';",
    "import { Plus, Search, FileText, Edit2, Trash2 } from 'lucide-react';"
  );
}

// Add handleDeleteAudit
if (!content.includes('handleDeleteAudit')) {
  content = content.replace(
    "const [searchTerm, setSearchTerm] = useState('');",
    "const [searchTerm, setSearchTerm] = useState('');\n  const [isEditModalOpen, setIsEditModalOpen] = useState(false);\n  const [editAudit, setEditAudit] = useState<InventoryAudit | null>(null);\n\n  const handleDeleteAudit = async (id: string) => {\n    if (!window.confirm('Bạn có chắc chắn muốn xóa phiếu kiểm kê này?')) return;\n    try {\n      const { error } = await supabase.from('inventory_audits').delete().eq('id', id);\n      if (error) throw error;\n      setAudits(audits.filter(a => a.id !== id));\n    } catch (error) {\n      console.error('Error deleting audit:', error);\n      alert('Không thể xóa phiếu kiểm kê.');\n    }\n  };"
  );
}

// Add buttons
const buttonHtml = `
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <button onClick={() => { setSelectedAudit(audit); setIsDetailModalOpen(true); }} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Chi tiết">
                            <FileText size={18} />
                          </button>
                          {(profile?.role === 'admin' || profile?.role === 'manager') && (
                            <>
                              <button onClick={() => { setEditAudit(audit); setIsEditModalOpen(true); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded" title="Chỉnh sửa">
                                <Edit2 size={18} />
                              </button>
                              <button onClick={() => handleDeleteAudit(audit.id)} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Xóa">
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
`;

content = content.replace(
  /<td className="px-6 py-4 text-center">\s*<button onClick=\{\(\) => \{ setSelectedAudit\(audit\); setIsDetailModalOpen\(true\); \}\} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Chi ti[^\"]*">\s*<FileText size=\{18\} \/>\s*<\/button>\s*<\/td>/g,
  buttonHtml
);

// Render the edit modal
const editModalHtml = `
      <AuditModal 
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditAudit(null); }}
        onSuccess={() => {
          setIsEditModalOpen(false);
          setEditAudit(null);
          // Reload
          supabase.from('inventory_audits').select('*').order('date', { ascending: false }).then(({data}) => {
             if (data) setAudits(data);
          });
        }}
        audit={editAudit}
      />
`;

if (!content.includes('isEditModalOpen')) {
   // Already handled above? wait, rendering logic is missing.
   content = content.replace(
     /<\/div>\s*<\/div>\s*<\/div>\s*<DetailAuditModal/m,
     "</div>\n        </div>\n      </div>\n" + editModalHtml + "      <DetailAuditModal"
   );
}

fs.writeFileSync('src/pages/InventoryAudits.tsx', content, 'utf8');
console.log('Added Edit/Delete to InventoryAudits');
