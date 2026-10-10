const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/AuditModal.tsx', 'utf8');

// 1. Import Select
if (!content.includes("import Select")) {
  content = content.replace(
    "import { X, FileText, Upload, Save, AlertCircle, Trash2 } from 'lucide-react';",
    "import { X, FileText, Upload, Save, AlertCircle, Trash2 } from 'lucide-react';\nimport Select from 'react-select';"
  );
}

// 2. Add allItems state
if (!content.includes('const [allItems, setAllItems]')) {
  content = content.replace(
    "const [auditLines, setAuditLines] = useState<AuditItemLine[]>([]);",
    "const [auditLines, setAuditLines] = useState<AuditItemLine[]>([]);\n  const [allItems, setAllItems] = useState<AuditItemLine[]>([]);"
  );
}

// 3. Update loadData to setAllItems and setAuditLines conditionally
content = content.replace(
  /const lines: AuditItemLine\[\] = items\.map[\s\S]*?setAuditLines\(lines\);/m,
  `const lines: AuditItemLine[] = items.map(item => {
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
              systemStock: stock,
              actualStock: existingItem ? (existingItem.actual_stock ?? stock) : stock,
              difference: existingItem ? (existingItem.difference ?? 0) : 0,
              notes: existingItem ? (existingItem.notes || '') : ''
            };
          });

          setAllItems(lines);
          
          if (audit) {
            setAuditLines(lines.filter(l => existingAuditItems.some(ei => ei.item_id === l.item.id)));
          } else {
            setAuditLines([]); // Start empty for new audit
          }`
);

// 4. Update handleFileUpload logic
content = content.replace(
  /const newLines = \[\.\.\.auditLines\];[\s\S]*?alert\('✓ L.* Excel!'\);/m,
  `const newLines = [...auditLines];
        let matchedCount = 0;
        let notFoundCount = 0;

        data.forEach((row: any) => {
          const code = row['Mã VT'] || row['Mã vật tư'] || row['code'] || row['Code'] || row['MA VT'] || row['MA v-t t'];
          const actualText = row['Tồn thực tế'] || row['Tồn kho'] || row['actualStock'] || row['Actual Stock'] || row['T"n thc t'];
          const name = row['Tên VT'] || row['Tên vật tư'] || row['name'] || row['Name'] || row['TAn VT'] || row['TAn v-t t'];

          if (!code) return; // Skip rows without code

          const lineFromAll = allItems.find(l => l.item.code?.toString().toLowerCase() === code.toString().toLowerCase());

          if (lineFromAll) {
            const actual = actualText !== undefined && actualText !== '' ? Number(actualText) : lineFromAll.systemStock;
            const existingIndex = newLines.findIndex(l => l.item.id === lineFromAll.item.id);
            
            if (existingIndex >= 0) {
              newLines[existingIndex].actualStock = actual;
              newLines[existingIndex].difference = actual - lineFromAll.systemStock;
            } else {
              newLines.push({ ...lineFromAll, actualStock: actual, difference: actual - lineFromAll.systemStock });
            }
            matchedCount++;
          } else {
            newLines.push({
              item: { id: '', code: code.toString(), name: name || 'Không xác định' },
              systemStock: 0,
              actualStock: actualText !== undefined && actualText !== '' ? Number(actualText) : 0,
              difference: actualText !== undefined && actualText !== '' ? Number(actualText) : 0,
              notes: 'Không tồn tại trên app',
              isNotFound: true
            });
            notFoundCount++;
          }
        });

        setAuditLines(newLines);
        alert(\`✓ Đã nhập xong!\\n- Khớp: \${matchedCount} vật tư\\n- Không tồn tại trên app: \${notFoundCount} vật tư\`);`
);

// 5. Change handleSave validLines logic
content = content.replace(
  /const validLines = auditLines\.filter\(line => !line\.isNotFound && line\.item\.id && line\.actualStock !== ''\);/g,
  "const validLines = auditLines.filter(line => !line.isNotFound && line.item.id);"
);

fs.writeFileSync('src/components/inventory/AuditModal.tsx', content, 'utf8');
console.log('Fixed AuditModal backend logic');
