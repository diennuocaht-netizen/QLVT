const fs = require('fs');

function fixFile(file) {
    let content = fs.readFileSync(file, 'utf8');

    // Add import if missing
    if (!content.includes('itemFromDatabase')) {
        content = content.replace(
            "import { supabase } from '../../supabase-client';",
            "import { supabase } from '../../supabase-client';\nimport { itemFromDatabase } from '../../utils/dataTransform';"
        );
    }

    // Fix setItems
    content = content.replace(
        /if \(data\) setItems\(data as Item\[\]\);/g,
        "if (data) setItems(data.map((item: any) => itemFromDatabase(item)) as Item[]);"
    );
    
    content = content.replace(
        /if \(data\) setItems\(data as any\);/g, // just in case
        "if (data) setItems(data.map((item: any) => itemFromDatabase(item)) as Item[]);"
    );
    
    // Also fix postgres changes setItems
    content = content.replace(
        /setItems\(prev => \[\.\.\.prev, payload\.new as Item\]\);/g,
        "setItems(prev => [...prev, itemFromDatabase(payload.new) as Item]);"
    );
    content = content.replace(
        /prev\.map\(item => item\.id === payload\.new\.id \? \(payload\.new as Item\) : item\)/g,
        "prev.map(item => item.id === payload.new.id ? (itemFromDatabase(payload.new) as Item) : item)"
    );

    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed itemFromDatabase in', file);
}

fixFile('src/components/inventory/DetailSlipModal.tsx');
fixFile('src/components/inventory/DetailRequisitionModal.tsx');
