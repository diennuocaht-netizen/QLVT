const fs = require('fs');
let content = fs.readFileSync('src/types/inventory.ts', 'utf8');

const newTypes = `
export interface InventoryReconciliationItem {
  id?: string;
  reconciliation_id?: string;
  item_id: string;
  bravo_receipts: number;
  app_receipts: number;
  bravo_issues: number;
  app_completed_issues: number;
  app_wip_issues: number;
  bravo_stock: number;
  app_stock: number;
  physical_stock: number | '';
  notes: string;
  // Runtime references
  item?: Partial<Item>;
}

export interface InventoryReconciliation {
  id: string;
  code: string;
  start_date: string;
  end_date: string;
  created_by: string;
  status: 'Nháp' | 'Đã chốt';
  notes?: string;
  created_at?: string;
  items?: InventoryReconciliationItem[];
}
`;

content += newTypes;
fs.writeFileSync('src/types/inventory.ts', content, 'utf8');
console.log('Added reconciliation types');
