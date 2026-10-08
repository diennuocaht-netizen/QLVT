const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/AuditModal.tsx', 'utf8');

// 1. In loadData, add the audit loading logic
if (!content.includes('existingAuditItems')) {
  content = content.replace(
    "const lines: AuditItemLine[] = items.map(item => {",
    `let existingAuditItems: any[] = [];
          if (audit) {
            const { data: aData } = await supabase.from('inventory_audit_items').select('*').eq('audit_id', audit.id);
            if (aData) existingAuditItems = aData;
            setNotes(audit.notes || '');
          } else {
            setNotes('');
          }
          const lines: AuditItemLine[] = items.map(item => {`
  );
  
  content = content.replace(
    /const stock = \(item\.initialStock \|\| 0\) \+ totalReceipts - totalIssues;[\s\S]*?return \{[\s\S]*?item,[\s\S]*?systemStock: stock,[\s\S]*?actualStock: stock,[\s\S]*?difference: 0,[\s\S]*?notes: ''[\s\S]*?\};/m,
    `const stock = (item.initialStock || 0) + totalReceipts - totalIssues;
            
            const existingItem = existingAuditItems.find(ei => ei.item_id === item.id);
  
            return {
              item,
              systemStock: existingItem ? existingItem.system_stock : stock,
              actualStock: existingItem ? (existingItem.actual_stock ?? stock) : stock,
              difference: existingItem ? (existingItem.difference ?? 0) : 0,
              notes: existingItem ? (existingItem.notes || '') : ''
            };`
  );
}

if (!content.includes('newAuditId')) {
  // 3. Modify handleSave
  content = content.replace(
    /const \{ data: audit, error: auditError \} = await supabase[\s\S]*?\.single\(\);/m,
    `let newAuditId = '';
        if (audit) {
          const { error: auditError } = await supabase.from('inventory_audits').update({ notes }).eq('id', audit.id);
          if (auditError) throw auditError;
          newAuditId = audit.id;
          await supabase.from('inventory_audit_items').delete().eq('audit_id', audit.id);
        } else {
          const { data: newAudit, error: auditError } = await supabase
            .from('inventory_audits')
            .insert({
              code,
              date: new Date().toISOString().split('T')[0],
              created_by: profile?.displayName || profile?.email || 'Unknown',
              status: 'Hoàn thành',
              notes: notes
            })
            .select()
            .single();
          if (auditError) throw auditError;
          newAuditId = newAudit.id;
        }`
  );
  
  content = content.replace(
    /audit_id: audit\.id,/,
    "audit_id: newAuditId,"
  );
}

fs.writeFileSync('src/components/inventory/AuditModal.tsx', content, 'utf8');
console.log('Fixed AuditModal with anchors');
