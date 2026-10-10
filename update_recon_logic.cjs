const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/ReconciliationModal.tsx', 'utf8');

// 1. Add selectedTemplateIds state
if (!content.includes('const [selectedTemplateIds, setSelectedTemplateIds]')) {
  content = content.replace(
    "const [notes, setNotes] = useState('');",
    "const [notes, setNotes] = useState('');\n  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[] | null>(null);"
  );
}

// 2. Change window.selectedTemplateIds to setSelectedTemplateIds
content = content.replace(/window\.selectedTemplateIds = selected\.value/g, "setSelectedTemplateIds(selected.value)");
content = content.replace(/window\.selectedTemplateIds = null/g, "setSelectedTemplateIds(null)");

// 3. Update handleFileUpload logic to filter rows
content = content.replace(
  "const items_array = Array.isArray(slip.items) ? slip.items : [];",
  "if (selectedTemplateIds && !selectedTemplateIds.includes(item.id)) return null;\n            const items_array = Array.isArray(slip.items) ? slip.items : [];"
);
content = content.replace(
  "const newLines = validRows.map(row => {",
  "const newLines = validRows.map(row => {"
);

// We need to filter `validRows` first or filter inside the map
const filterLogic = `
          const mappedLines = validRows.map(row => {
            const itemCode = (row[colCode] || '').toString().trim();
            const itemName = (row[colName] || '').toString().trim();
            const unit = (row[colUnit] || '').toString().trim();
            
            const bravoReceipts = parseFloat(row[colReceipts]) || 0;
            const bravoIssues = parseFloat(row[colIssues]) || 0;
            const bravoStock = parseFloat(row[colStock]) || 0;
            
            const item = allItems.find(i => i.code === itemCode);
            if (!item) return null;
            
            if (selectedTemplateIds && !selectedTemplateIds.includes(item.id)) {
              return null; // Skip this item as it's not in the selected template
            }
`;
// Let's replace the inner map of handleFileUpload:
content = content.replace(
  /const newLines = validRows\.map\(row => \{[\s\S]*?const item = allItems\.find\(i => i\.code === itemCode\);\s*if \(\!item\) return null;/m,
  filterLogic
);

content = content.replace(/setReconLines\(newLines\.filter\(Boolean\)/, "setReconLines(mappedLines.filter(Boolean)");
content = content.replace(/const newLines = validRows/, "const mappedLines = validRows");

fs.writeFileSync('src/components/inventory/ReconciliationModal.tsx', content, 'utf8');
