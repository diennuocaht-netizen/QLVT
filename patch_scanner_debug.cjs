const fs = require('fs');
const file = 'src/components/inventory/QRScannerModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update debug text to show more details
const oldDebug = "<strong>MA trA-ch xu_t:</strong> {debugText.substring(6).split(',').map(c => c.trim()).join(' | ')}<br/>";
const newDebug = "<strong>Mã trích xuất:</strong> {debugText.substring(0, 4) === 'GRP:' ? 'Xem log console' : debugText.substring(6).split(',').map(c => c.trim()).join(' | ')}<br/>";
content = content.replace("<strong>MA trA-ch xut:</strong> {debugText.substring(6).split(',').map(c => c.trim()).join(' | ')}<br/>", newDebug);
// Wait, encoding issue, I'll just replace the whole debug box to be safe.

const debugBlockRegex = /<div className="mt-4 p-2 bg-gray-100 rounded text-xs text-left overflow-auto break-all">[\s\S]*?<\/div>/;
const newDebugBlock = `<div className="mt-4 p-2 bg-gray-100 rounded text-xs text-left overflow-auto break-all">
                  <strong>Chuỗi quét được:</strong> {debugText}<br/>
                  <strong>Mã trích xuất:</strong> {debugText.startsWith('GRP:') ? 'Nhóm QR' : debugText.substring(6)}<br/>
                  {debugError && <strong className="text-red-500">Lỗi: {debugError}</strong>}
                </div>`;
content = content.replace(debugBlockRegex, newDebugBlock);

// Add better error handling/reporting for GRP
const tryBlockRegex = /if \(decodedText\.startsWith\('GRP:'\)\) \{[\s\S]*?else \{/
const newTryBlock = `if (decodedText.startsWith('GRP:')) {
                        const { data: grpData, error: grpError } = await supabase
                          .from('qr_groups')
                          .select('item_codes')
                          .eq('group_code', decodedText)
                          .maybeSingle();
                        if (grpError) {
                          setDebugError("DB Error: " + JSON.stringify(grpError));
                        } else if (!grpData) {
                          setDebugError("Không tìm thấy mã nhóm " + decodedText + " trên database.");
                        } else if (grpData && grpData.item_codes) {
                           codes = Array.isArray(grpData.item_codes) ? grpData.item_codes : JSON.parse(grpData.item_codes);
                           if (!codes || codes.length === 0) setDebugError("Nhóm này không có mã vật tư nào bên trong.");
                        }
                      } else {`;
content = content.replace(tryBlockRegex, newTryBlock);

fs.writeFileSync(file, content, 'utf8');
console.log('Patched QRScannerModal debug logic');
