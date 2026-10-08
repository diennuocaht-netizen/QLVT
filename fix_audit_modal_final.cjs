const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/AuditModal.tsx', 'utf8');

// 1. Add audit prop
content = content.replace(
  'onSuccess: () => void;\n}',
  'onSuccess: () => void;\n  audit?: any | null;\n}'
);

content = content.replace(
  'export const AuditModal: React.FC<AuditModalProps> = ({ isOpen, onClose, onSuccess }) => {',
  'export const AuditModal: React.FC<AuditModalProps> = ({ isOpen, onClose, onSuccess, audit }) => {'
);

// 2. Modify loadData
const oldLoadData = `        // Calculate system stock
        const lines: AuditItemLine[] = items.map(item => {
          let totalReceipts = 0;
          let totalIssues = 0;

          slips.forEach(slip => {
            const items_array = Array.isArray(slip.items) ? slip.items : [];
            const matchingItems = items_array.filter((i: any) => {
              const idKey = i.itemId ?? i.item_id ?? i.itemId;
              return idKey === item.id;
            });
            if (matchingItems.length === 0) return;

            const sumQty = matchingItems.reduce((s: number, it: any) => s + Number(it.quantity || 0), 0);

            if (slip.type === SlipType.Receipt && (slip.status === 'Đã đóng' || slip.status === 'Đã hoàn thành')) {
              totalReceipts += sumQty;
            } else if (slip.type === SlipType.Issue) {
              totalIssues += sumQty;
            }
          });

          const stock = (item.initialStock || 0) + totalReceipts - totalIssues;

          return {
            item,
            systemStock: stock,
            actualStock: stock, // Default to system stock
            difference: 0,
            notes: ''
          };
        });

        setAuditLines(lines);`;

const newLoadData = `        // If editing an existing audit, fetch its items
        let existingAuditItems: any[] = [];
        if (audit) {
          const { data: aData } = await supabase.from('inventory_audit_items').select('*').eq('audit_id', audit.id);
          if (aData) existingAuditItems = aData;
          setNotes(audit.notes || '');
        } else {
          setNotes('');
        }

        // Calculate system stock
        const lines: AuditItemLine[] = items.map(item => {
          let totalReceipts = 0;
          let totalIssues = 0;

          slips.forEach(slip => {
            const items_array = Array.isArray(slip.items) ? slip.items : [];
            const matchingItems = items_array.filter((i: any) => {
              const idKey = i.itemId ?? i.item_id ?? i.itemId;
              return idKey === item.id;
            });
            if (matchingItems.length === 0) return;

            const sumQty = matchingItems.reduce((s: number, it: any) => s + Number(it.quantity || 0), 0);

            if (slip.type === SlipType.Receipt && (slip.status === 'Đã đóng' || slip.status === 'Đã hoàn thành')) {
              totalReceipts += sumQty;
            } else if (slip.type === SlipType.Issue) {
              totalIssues += sumQty;
            }
          });

          const stock = (item.initialStock || 0) + totalReceipts - totalIssues;
          
          const existingItem = existingAuditItems.find(ei => ei.item_id === item.id);

          return {
            item,
            systemStock: existingItem ? existingItem.system_stock : stock,
            actualStock: existingItem ? (existingItem.actual_stock ?? stock) : stock,
            difference: existingItem ? (existingItem.difference ?? 0) : 0,
            notes: existingItem ? (existingItem.notes || '') : ''
          };
        });

        setAuditLines(lines);`;

content = content.replace(oldLoadData, newLoadData);

// 3. Modify handleSave
const oldSave = `      const { data: newAudit, error: auditError } = await supabase
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

      // Only save items that exist in the system
      const validLines = auditLines.filter(line => !line.isNotFound && line.item.id);
      
      const itemsToInsert = validLines.map(line => ({
        audit_id: newAudit.id,
        item_id: line.item.id,
        system_stock: line.systemStock,
        actual_stock: line.actualStock === '' ? line.systemStock : line.actualStock,
        difference: line.difference,
        notes: line.notes
      }));

      const { error: itemsError } = await supabase
        .from('inventory_audit_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;`;

const newSave = `      let newAuditId = '';
      if (audit) {
        // Update existing
        const { error: auditError } = await supabase
          .from('inventory_audits')
          .update({
            notes: notes
          })
          .eq('id', audit.id);
        if (auditError) throw auditError;
        newAuditId = audit.id;

        // Delete old items
        await supabase.from('inventory_audit_items').delete().eq('audit_id', audit.id);
      } else {
        // Insert new
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
      }

      // Only save items that exist in the system
      const validLines = auditLines.filter(line => !line.isNotFound && line.item.id);
      
      const itemsToInsert = validLines.map(line => ({
        audit_id: newAuditId,
        item_id: line.item.id,
        system_stock: line.systemStock,
        actual_stock: line.actualStock === '' ? line.systemStock : line.actualStock,
        difference: line.difference,
        notes: line.notes
      }));

      const { error: itemsError } = await supabase
        .from('inventory_audit_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;`;

content = content.replace(oldSave, newSave);

fs.writeFileSync('src/components/inventory/AuditModal.tsx', content, 'utf8');
console.log('Fixed AuditModal correctly');
