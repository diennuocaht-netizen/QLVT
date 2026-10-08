const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/AuditModal.tsx', 'utf8');

const loadDataRegex = /const lines: AuditItemLine\[\] = items\.map\(item => \{[\s\S]*?setAuditLines\(lines\);/m;

const newLoadData = `
          // If editing an existing audit, fetch its items
          let existingAuditItems: any[] = [];
          if (audit) {
            const { data: aData } = await supabase.from('inventory_audit_items').select('*').eq('audit_id', audit.id);
            if (aData) existingAuditItems = aData;
            setNotes(audit.notes || '');
          } else {
            setNotes('');
          }

          // Calculate system stock
          let lines: AuditItemLine[] = items.map(item => {
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
  
              if (slip.type === SlipType.Receipt && (slip.status === 'Đã đóng' || slip.status === 'Đã hoàn thành' || slip.status === 'Đã đA³ng' || slip.status.includes('ng'))) {
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
              actualStock: existingItem ? existingItem.actual_stock : stock,
              difference: existingItem ? existingItem.difference : 0,
              notes: existingItem ? (existingItem.notes || '') : ''
            };
          });

          setAuditLines(lines);
`;

content = content.replace(loadDataRegex, newLoadData);
fs.writeFileSync('src/components/inventory/AuditModal.tsx', content, 'utf8');
console.log('Fixed loadData');
