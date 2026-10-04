const fs = require('fs');

let content = fs.readFileSync('src/components/inventory/DetailSlipModal.tsx', 'utf8');

// 1. Apply .in() logic
const regex = /const \{ data \} = await supabase\.from\('inventory_items'\)\.select\('\*'\)(?:\.limit\(\d+\))?;/g;
content = content.replace(regex, `
        const itemIds = slip?.items.map(i => i.itemId).filter(Boolean) || [];
        if (itemIds.length === 0) return;
        const { data } = await supabase.from('inventory_items').select('*').in('id', itemIds);
`);
const subRegex = /supabase\.from\('inventory_items'\)\.select\('\*'\)(?:\.limit\(\d+\))?\.then/g;
content = content.replace(subRegex, `
              const currentIds = slip?.items.map(i => i.itemId).filter(Boolean) || [];
              if (currentIds.length === 0) return;
              supabase.from('inventory_items').select('*').in('id', currentIds).then
`);

// 2. Fix useEffect dependencies
content = content.replace(/loadAndSubscribe\(\);\s*return \(\) => \{\s*if \(channel\) supabase.removeChannel\(channel\);\s*\};\s*\}, \[\]\);/g, `loadAndSubscribe();
      return () => {
        if (channel) supabase.removeChannel(channel);
      };
    }, [slip?.id]);`);

// 3. Make item name larger and swap
content = content.replace(
    /<span className="font-medium">\{getItemName\(item\.itemId\)\}<\/span>\s*<br \/>\s*<span className="text-sm text-gray-600">\{getItemCode\(item\.itemId\)\}<\/span>/g,
    `<span className="font-semibold text-base text-indigo-700 block mb-1">{getItemName(item.itemId)}</span>
                                <span className="text-sm text-gray-500">{getItemCode(item.itemId)}</span>`
);
// Also it might have been in the original file as:
content = content.replace(
    /<span className="font-medium">\{getItemCode\(item\.itemId\)\}<\/span>\s*<br \/>\s*<span className="text-sm text-gray-600">\{getItemName\(item\.itemId\)\}<\/span>/g,
    `<span className="font-semibold text-base text-indigo-700 block mb-1">{getItemName(item.itemId)}</span>
                                <span className="text-sm text-gray-500">{getItemCode(item.itemId)}</span>`
);


// 4. Add Ghi chú column safely using index-based replacement or very safe regex
// For Header (Nhập)
content = content.replace(
    /<th className="px-4 py-3 text-left font-medium text-gray-600">Tờ Trình<\/th>/,
    `<th className="px-4 py-3 text-left font-medium text-gray-600">Tờ Trình</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">Ghi chú</th>`
);

// For Header (Xuất)
content = content.replace(
    /<th className="px-4 py-3 text-left font-medium text-gray-600">Mã Chi Phí<\/th>/,
    `<th className="px-4 py-3 text-left font-medium text-gray-600">Mã Chi Phí</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-600">Ghi chú</th>`
);

// For Cell (Nhập)
content = content.replace(
    /<td className="px-4 py-3 text-gray-900">\{getRequisitionCode\(item\.requisitionId\)\}<\/td>/,
    `<td className="px-4 py-3 text-gray-900">{getRequisitionCode(item.requisitionId)}</td>
                              <td className="px-4 py-3 text-gray-900">{item.notes || '-'}</td>`
);

// For Cell (Xuất)
content = content.replace(
    /<td className="px-4 py-3 text-gray-900">\{item\.expenseCode \|\| '-'\}<\/td>/,
    `<td className="px-4 py-3 text-gray-900">{item.expenseCode || '-'}</td>
                              <td className="px-4 py-3 text-gray-900">{item.notes || '-'}</td>`
);

fs.writeFileSync('src/components/inventory/DetailSlipModal.tsx', content, 'utf8');
console.log('Re-applied all fixes to DetailSlipModal');
