const fs = require('fs');

let content = fs.readFileSync('src/components/inventory/DetailRequisitionModal.tsx', 'utf8');

const regex = /const \{ data \} = await supabase\.from\('inventory_items'\)\.select\('\*'\)(?:\.limit\(\d+\))?;/g;
content = content.replace(regex, `
        const itemIds = requisition?.items.map(i => i.itemId).filter(Boolean) || [];
        if (itemIds.length === 0) return;
        const { data } = await supabase.from('inventory_items').select('*').in('id', itemIds);
`);

const subRegex = /supabase\.from\('inventory_items'\)\.select\('\*'\)(?:\.limit\(\d+\))?\.then/g;
content = content.replace(subRegex, `
              const currentIds = requisition?.items.map(i => i.itemId).filter(Boolean) || [];
              if (currentIds.length === 0) return;
              supabase.from('inventory_items').select('*').in('id', currentIds).then
`);

content = content.replace(/loadAndSubscribe\(\);\s*return \(\) => \{\s*if \(channel\) supabase.removeChannel\(channel\);\s*\};\s*\}, \[\]\);/g, `loadAndSubscribe();
      return () => {
        if (channel) supabase.removeChannel(channel);
      };
    }, [requisition?.id]);`);

// Also change the size of the item name in DetailRequisitionModal to match DetailSlipModal for consistency
content = content.replace(
    /<td className="px-4 py-3 text-gray-900 font-medium">\{getItemName\(item\.itemId\)\}<\/td>/g,
    `<td className="px-4 py-3 text-gray-900">
                                <span className="font-semibold text-base text-indigo-700 block mb-1">{getItemName(item.itemId)}</span>
                                <span className="text-sm text-gray-500">{getItemCode(item.itemId)}</span>
                              </td>`
);

// We need to also remove the explicit getItemCode cell if we stack them
content = content.replace(
    /<td className="px-4 py-3 text-gray-900 font-medium">\{getItemCode\(item\.itemId\)\}<\/td>\s*<td className="px-4 py-3 text-gray-900">/g,
    `<td className="px-4 py-3 text-gray-900">`
);


fs.writeFileSync('src/components/inventory/DetailRequisitionModal.tsx', content, 'utf8');
console.log('Patched DetailRequisitionModal');
