const fs = require('fs');
let content = fs.readFileSync('src/pages/InventoryAudits.tsx', 'utf8');

// Replace the Edit2 button logic to use isModalOpen
content = content.replace(
  /onClick=\{\(\) => \{ setEditAudit\(audit\); setIsEditModalOpen\(true\); \}\}/g,
  "onClick={() => { setEditAudit(audit); setIsModalOpen(true); }}"
);

// Replace the "Tạo Phiếu Kiểm Kê" button to reset editAudit
content = content.replace(
  /onClick=\{\(\) => setIsModalOpen\(true\)\}/g,
  "onClick={() => { setEditAudit(null); setIsModalOpen(true); }}"
);

// Pass editAudit to the AuditModal render
content = content.replace(
  /<AuditModal \s*isOpen=\{isModalOpen\}\s*onClose=\{\(\) => setIsModalOpen\(false\)\}\s*onSuccess=\{\(\) => \{\s*\/\/ data will be reloaded due to useEffect dependency\s*\}\}\s*\/>/m,
  `<AuditModal 
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditAudit(null); }}
        onSuccess={() => {
          setIsModalOpen(false);
          setEditAudit(null);
          // Reload data
          supabase.from('inventory_audits').select('*').order('date', { ascending: false }).then(({data}) => {
             if (data) setAudits(data);
          });
        }}
        audit={editAudit}
      />`
);

fs.writeFileSync('src/pages/InventoryAudits.tsx', content, 'utf8');
console.log('Fixed AuditModal rendering');
