const fs = require('fs');

let content = fs.readFileSync('src/components/inventory/DetailSlipModal.tsx', 'utf8');

content = content.replace(
    /const itemIds = slip\?\.items\.map\(i => i\.itemId\)\.filter\(Boolean\) \|\| \[\];\s*const \{ data \} = await supabase\.from\('inventory_items'\)\.select\('\*'\)\.in\('id', itemIds\);\s*if \(data\)/g,
    `const itemIds = slip?.items.map(i => i.itemId).filter(Boolean) || [];
        if (itemIds.length === 0) return;
        const { data } = await supabase.from('inventory_items').select('*').in('id', itemIds);

        if (data)`
);

content = content.replace(
    /const currentIds = slip\?\.items\.map\(i => i\.itemId\)\.filter\(Boolean\) \|\| \[\];\s*supabase\.from\('inventory_items'\)\.select\('\*'\)\.in\('id', currentIds\)\.then/g,
    `const currentIds = slip?.items.map(i => i.itemId).filter(Boolean) || [];
              if (currentIds.length === 0) return;
              supabase.from('inventory_items').select('*').in('id', currentIds).then`
);

fs.writeFileSync('src/components/inventory/DetailSlipModal.tsx', content, 'utf8');
console.log('Patched DetailSlipModal with empty array guard');
