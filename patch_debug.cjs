const fs = require('fs');
const file = 'src/components/inventory/QRScannerModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add debug state
content = content.replace(
  'const [loadingMulti, setLoadingMulti] = useState(false);',
  `const [loadingMulti, setLoadingMulti] = useState(false);
  const [debugText, setDebugText] = useState("");
  const [debugError, setDebugError] = useState("");`
);

// Update success callback to store debug info
const oldTryBlock = `                  try {
                    const { data } = await supabase
                      .from('inventory_items')
                      .select('id, code, name, unit, category, specifications')
                      .in('code', codes);
                    if (data) {
                      setMultiVariants(data);
                    }
                  } catch (e) {
                    console.error(e);
                  }`;
                  
const newTryBlock = `                  try {
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
content = content.replace(oldTryBlock, newTryBlock);

// Update UI to show debug info if empty
const oldEmptyState = `<div className="text-center text-gray-500 mt-10">Không tìm thấy dữ liệu vật tư nào trong mã này.</div>`;
const newEmptyState = `<div className="text-center text-gray-500 mt-10">
                <p>Không tìm thấy dữ liệu vật tư nào trong mã này.</p>
                <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-left overflow-auto break-all">
                  <strong>Chuỗi quét được:</strong> {debugText}<br/>
                  <strong>Mã trích xuất:</strong> {debugText.substring(6).split(',').map(c => c.trim()).join(' | ')}<br/>
                  {debugError && <strong className="text-red-500">Lỗi: {debugError}</strong>}
                </div>
              </div>`;
content = content.replace(oldEmptyState, newEmptyState);

fs.writeFileSync(file, content, 'utf8');
console.log('OK patched');
