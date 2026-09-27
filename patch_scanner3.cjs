const fs = require('fs');
const file = 'src/components/inventory/QRScannerModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const startIdx = content.indexOf("if (decodedText.startsWith('MULTI:')) {");
const nextIdx = content.indexOf("const { data, error } = await supabase", startIdx);

const newBlock = `if (decodedText.startsWith('MULTI:') || decodedText.startsWith('GRP:')) {
                  setLoadingMulti(true);
                  setMultiVariants([]);
                  setDebugText(decodedText);
                  try {
                      let codes = [];
                      if (decodedText.startsWith('GRP:')) {
                        const { data: grpData, error: grpError } = await supabase
                          .from('qr_groups')
                          .select('item_codes')
                          .eq('group_code', decodedText)
                          .maybeSingle();
                        if (grpError) {
                          setDebugError(JSON.stringify(grpError));
                          console.error(grpError);
                        }
                        if (grpData && grpData.item_codes) {
                           codes = Array.isArray(grpData.item_codes) ? grpData.item_codes : JSON.parse(grpData.item_codes);
                        }
                      } else {
                        codes = decodedText.substring(6).split(',').map(c => c.trim());
                      }
                      
                      `;
                      
if (startIdx !== -1 && nextIdx !== -1) {
  content = content.substring(0, startIdx) + newBlock + content.substring(nextIdx);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Fixed QRScannerModal.tsx properly');
} else {
  console.log('Could not find boundaries');
}
