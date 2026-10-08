const fs = require('fs');
const filename = 'src/pages/InventoryItems.tsx';
let content = fs.readFileSync(filename, 'utf8');

// 1. Order queries
content = content.replace(
  /supabase\.from\('inventory_items'\)\.select\('\*'\)\.limit\(10000\)/g,
  "supabase.from('inventory_items').select('*').order('created_at', { ascending: false }).limit(10000)"
);
content = content.replace(
  /supabase\.from\('inventory_slips'\)\.select\('\*'\)/g,
  "supabase.from('inventory_slips').select('*').order('created_at', { ascending: false })"
);

// 2. Put new item at the top in ItemModal onSuccess
content = content.replace(
  /return \[\.\.\.prev, savedItem\];/g,
  "return [savedItem, ...prev];"
);

// 3. Put new item at the top in Realtime INSERT
content = content.replace(
  /return \[\.\.\.prev, newItem\];/g,
  "return [newItem, ...prev];"
);

fs.writeFileSync(filename, content, 'utf8');
console.log('Fixed item ordering');
