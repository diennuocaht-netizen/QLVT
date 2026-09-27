const fs = require('fs');
const file = 'src/components/inventory/QRScannerModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /if \(decodedText\.startsWith\('MULTI:'\)\) \{[\s\S]*?const codes = decodedText\.substring\(6\)\.split\(\',\('\)\.map\(c => c\.trim\(\)\);/;
// Wait, my regex above had \(\',\('\), which is wrong. It should be \',\'.

const oldBlock = `if (decodedText.startsWith('MULTI:')) {
                  const codes = decodedText.substring(6).split(',').map(c => c.trim());
                  setLoadingMulti(true);
                  setMultiVariants([]); // trigger UI change
                  try {
                      setDebugText(decodedText);`;

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
                      }`;

if (content.includes("setLoadingMulti(true);")) {
    console.log("Replacing using string matching...");
    // Let's just find the index of "if (decodedText.startsWith('MULTI:')) {"
    const startIdx = content.indexOf("if (decodedText.startsWith('MULTI:')) {");
    if (startIdx !== -1) {
        // Find the index of "const { data, error } = await supabase"
        const nextIdx = content.indexOf("const { data, error } = await supabase", startIdx);
        if (nextIdx !== -1) {
            content = content.substring(0, startIdx) + newBlock + '\n                      ' + content.substring(nextIdx);
            fs.writeFileSync(file, content, 'utf8');
            console.log("Replaced successfully!");
        }
    }
}
