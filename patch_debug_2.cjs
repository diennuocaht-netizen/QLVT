const fs = require('fs');
const file = 'src/components/inventory/QRScannerModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Use regex to properly replace the try block
const tryRegex = /try\s*\{\s*const\s*\{\s*data\s*\}\s*=\s*await\s*supabase[\s\S]*?\}\s*catch\s*\(e\)\s*\{\s*console\.error\(e\);\s*\}/m;
const match = content.match(tryRegex);

if (match) {
  const newTryBlock = `try {
                    setDebugText(decodedText);
                    const { data, error } = await supabase
                      .from('inventory_items')
                      .select('id, code, name, unit, category, specifications')
                      .in('code', codes);
                    if (error) {
                      setDebugError(JSON.stringify(error));
                      console.error(error);
                    }
                    if (data) {
                      setMultiVariants(data);
                    }
                  } catch (e: any) {
                    setDebugError(e.message || String(e));
                    console.error(e);
                  }`;
  content = content.replace(tryRegex, newTryBlock);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Successfully patched try block');
} else {
  console.log('Failed to match try block');
}
