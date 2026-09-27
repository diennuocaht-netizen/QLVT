const fs = require('fs');
const file = 'src/components/inventory/BulkPrintQRModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const \[groupId\] = useState\(\(\) => crypto\.randomUUID\(\)\.substring\(0, 6\)\.toUpperCase\(\)\);/;
const insertAfter = `
  useEffect(() => {
    if (isGrouped && items.length > 0) {
      const saveToDb = async () => {
        try {
          const itemCodes = items.map(i => i.code);
          await supabase.from('qr_groups').upsert({
            group_code: \`GRP:\${groupId}\`,
            item_codes: itemCodes
          }, { onConflict: 'group_code' });
        } catch (e) {
          console.error('Auto save QR group failed', e);
        }
      };
      saveToDb();
    }
  }, [isGrouped, items, groupId]);
`;

if (content.includes("const [groupId] = useState(() => crypto.randomUUID().substring(0, 6).toUpperCase());")) {
    const idx = content.indexOf("const [groupId] = useState(() => crypto.randomUUID().substring(0, 6).toUpperCase());");
    const insertIdx = content.indexOf('\n', idx);
    content = content.substring(0, insertIdx) + insertAfter + content.substring(insertIdx);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Added auto-save useEffect for QR group!');
} else {
    console.log('Could not find groupId state.');
}
