const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/ReconciliationModal.tsx', 'utf8');

// 1. Add templates state
if (!content.includes('const [templates, setTemplates]')) {
  content = content.replace(
    "const [allItems, setAllItems] = useState<Item[]>([]);",
    "const [allItems, setAllItems] = useState<Item[]>([]);\n  const [templates, setTemplates] = useState<any[]>([]);"
  );
}
if (!content.includes('import Select')) {
  content = content.replace(
    "import * as XLSX from 'xlsx';",
    "import * as XLSX from 'xlsx';\nimport Select from 'react-select';"
  );
}

// 2. Fetch templates
if (!content.includes("await supabase.from('inventory_audit_templates').select('*')")) {
  content = content.replace(
    "if (data) setAllItems(data.map(itemFromDatabase));",
    "if (data) setAllItems(data.map(itemFromDatabase));\n        const { data: tData } = await supabase.from('inventory_audit_templates').select('*');\n        if (tData) setTemplates(tData);"
  );
}

// 3. Helper to generate lines from template
const templateLogic = `
  const handleSelectTemplate = async (selected: any) => {
    if (!selected || !selected.value) return;
    if (!startDate || !endDate) {
      alert('Vui lòng chọn khoảng thời gian đối soát trước!');
      return;
    }
    
    const ids = selected.value as string[];
    const items = allItems.filter(i => ids.includes(i.id));
    
    const slips = await loadAppSlips(startDate, endDate);
    
    const newLines = items.map(item => {
      let appReceipts = 0;
      let appCompletedIssues = 0;
      let appPendingIssues = 0;
      
      slips.forEach(slip => {
        const items_array = Array.isArray(slip.items) ? slip.items : [];
        const slipItem = items_array.find((i: any) => {
          const idKey = i.itemId ?? i.item_id ?? i.itemId;
          return idKey === item.id;
        });
        
        if (slipItem) {
          if (slip.type === SlipType.Receipt && (slip.status === SlipStatus.Completed || slip.status === SlipStatus.Closed)) {
            appReceipts += (slipItem.quantity || 0);
          } else if (slip.type === SlipType.Issue) {
            const completedQty = slipItem.completedQuantity || 0;
            const isFullyCompleted = slip.isCompleted;
            if (isFullyCompleted) {
              appCompletedIssues += (slipItem.quantity || 0);
            } else {
              appCompletedIssues += completedQty;
              appPendingIssues += Math.max(0, (slipItem.quantity || 0) - completedQty);
            }
          }
        }
      });
      
      return {
        id: crypto.randomUUID(),
        reconciliation_id: '',
        item_id: item.id,
        item: item,
        bravo_receipts: 0,
        bravo_issues: 0,
        bravo_stock: 0,
        app_receipts: appReceipts,
        app_completed_issues: appCompletedIssues,
        app_pending_issues: appPendingIssues,
        app_stock: 0, // usually calculated based on opening balance, here simplified
        physical_stock: 0,
        notes: 'Từ danh sách mẫu'
      } as InventoryReconciliationItem;
    });
    
    setReconLines(newLines);
  };
`;

if (!content.includes('handleSelectTemplate')) {
  content = content.replace(
    "const handleFileUpload =",
    templateLogic + "\n  const handleFileUpload ="
  );
}

// 4. Add template UI
const templateUI = `
            <div className="bg-gray-50 p-4 rounded-xl space-y-3">
              <label className="block text-sm font-medium text-gray-700">Cách 2: Chọn danh sách vật tư mẫu</label>
              <Select
                options={templates.map(t => ({ value: t.item_ids, label: t.name + (t.description ? \` - \${t.description}\` : '') }))}
                onChange={handleSelectTemplate}
                placeholder="Chọn danh sách mẫu..."
                isClearable
                value={null}
              />
              <p className="text-xs text-gray-500">Hệ thống sẽ tự động tổng hợp số liệu nhập/xuất trên App cho các vật tư này.</p>
            </div>
`;

if (!content.includes('Cách 2:')) {
  content = content.replace(
    /<p className="text-xs text-gray-500 text-center">\s*Chn khong thi gian.*?\s*<\/p>\s*<\/div>/,
    "$&" + "\n" + templateUI
  );
}

// Also rename the upload label to "Cách 1: Import Báo cáo Bravo"
content = content.replace(
  /Import Bo co Bravo/,
  "Cách 1: Import Báo cáo Bravo"
);
content = content.replace(
  /Import Báo cáo Bravo/,
  "Cách 1: Import Báo cáo Bravo"
);

fs.writeFileSync('src/components/inventory/ReconciliationModal.tsx', content, 'utf8');
console.log('Fixed ReconciliationModal template selection');
