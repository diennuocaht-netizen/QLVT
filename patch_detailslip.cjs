const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/DetailSlipModal.tsx', 'utf8');

if (!content.includes('itemFromDatabase')) {
    content = content.replace(
        "import { InventorySlip, SlipType, Item, Requisition } from '../../types/inventory';",
        "import { InventorySlip, SlipType, Item, Requisition } from '../../types/inventory';\nimport { itemFromDatabase } from '../../utils/dataTransform';"
    );
    
    content = content.replace(
        "if (data) setItems(data as Item[]);",
        "if (data) setItems(data.map(item => itemFromDatabase(item)) as Item[]);"
    );

    content = content.replace(
        "setItems(prev => [...prev, payload.new as Item]);",
        "setItems(prev => [...prev, itemFromDatabase(payload.new) as Item]);"
    );

    content = content.replace(
        "prev.map(item => item.id === payload.new.id ? (payload.new as Item) : item)",
        "prev.map(item => item.id === payload.new.id ? (itemFromDatabase(payload.new) as Item) : item)"
    );

    fs.writeFileSync('src/components/inventory/DetailSlipModal.tsx', content, 'utf8');
    console.log('DetailSlipModal patched with itemFromDatabase');
} else {
    console.log('DetailSlipModal already has itemFromDatabase');
}
