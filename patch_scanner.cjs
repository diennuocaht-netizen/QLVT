const fs = require('fs');
const file = 'src/components/inventory/QRScannerModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /if \(decodedText\.startsWith\('MULTI:'\)\) \{[\s\S]*?const codes = decodedText\.substring\(6\)\.split\(\',\('\)\.map\(c => c\.trim\(\)\);/
// Wait, the regex might fail because of `.split(',').map`. Let's just find `if (decodedText.startsWith('MULTI:')) {`
const blockToReplace = `if (decodedText.startsWith('MULTI:')) {
                  const codes = decodedText.substring(6).split(',').map(c => c.trim());`;

const newBlock = `if (decodedText.startsWith('MULTI:') || decodedText.startsWith('GRP:')) {
                  setLoadingMulti(true);
                  setMultiVariants([]);
                  setDebugText(decodedText);
                  try {
                    let codes = [];
                    if (decodedText.startsWith('GRP:')) {
                      // Fetch codes from database
                      const { data: grpData, error: grpError } = await supabase
                        .from('qr_groups')
                        .select('item_codes')
                        .eq('group_code', decodedText)
                        .maybeSingle();
                        
                      if (grpError) {
                        setDebugError(JSON.stringify(grpError));
                        throw grpError;
                      }
                      if (grpData && grpData.item_codes) {
                        codes = Array.isArray(grpData.item_codes) ? grpData.item_codes : JSON.parse(grpData.item_codes);
                      } else {
                        throw new Error('Không tìm thấy mã nhóm này trên hệ thống');
                      }
                    } else {
                      codes = decodedText.substring(6).split(',').map(c => c.trim());
                    }
                    
                    // Now we have the codes, proceed to fetch items (Skip setting loading/variants/debug text again since we did it above)
                    `;
content = content.replace(blockToReplace, newBlock);

// Clean up the inner logic inside try block of the original code, since we moved some parts
content = content.replace("setLoadingMulti(true);", "");
content = content.replace("setMultiVariants([]); // trigger UI change", "");
content = content.replace("setDebugText(decodedText);", "");

fs.writeFileSync(file, content, 'utf8');
console.log('QRScannerModal updated for GRP:');
