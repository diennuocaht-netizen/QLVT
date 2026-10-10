const fs = require('fs');
let content = fs.readFileSync('src/pages/InventorySettings.tsx', 'utf8');

content = content.replace(
  "supabase.from('inventory_locations').select('*'),\n        ]);",
  "supabase.from('inventory_locations').select('*'),\n          supabase.from('inventory_audit_templates').select('*'),\n          supabase.from('inventory_items').select('id, code, name'),\n        ]);"
);

fs.writeFileSync('src/pages/InventorySettings.tsx', content, 'utf8');
