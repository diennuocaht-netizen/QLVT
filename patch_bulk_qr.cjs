const fs = require('fs');
const file = 'src/components/inventory/BulkPrintQRModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Import supabase
if (!content.includes('supabase')) {
  content = content.replace(
    "import { Item } from '../../types/inventory';",
    "import { Item } from '../../types/inventory';\nimport { supabase } from '../../supabase-client';"
  );
}

// Add state for groupId and handlePrintWrapper
const targetState = "const [isGrouped, setIsGrouped] = useState(false);";
const replacementState = `const [isGrouped, setIsGrouped] = useState(false);
  const [groupId] = useState(() => crypto.randomUUID().substring(0, 6).toUpperCase());
  const [isSaving, setIsSaving] = useState(false);`;
content = content.replace(targetState, replacementState);

// Replace multiQrValue
const oldMulti = "const multiQrValue = `MULTI:${groupedCodes}`;";
const newMulti = "const multiQrValue = `GRP:${groupId}`;";
content = content.replace(oldMulti, newMulti);

// Replace print button logic
// First we need to define executePrint
const executePrintLogic = `
  const executePrint = async () => {
    if (isGrouped) {
      setIsSaving(true);
      try {
        const itemCodes = items.map(i => i.code);
        const { error } = await supabase.from('qr_groups').upsert({
          group_code: multiQrValue,
          item_codes: itemCodes
        }, { onConflict: 'group_code' });
        
        if (error) throw error;
      } catch (err) {
        console.error('Lỗi lưu group QR:', err);
        alert('Có lỗi xảy ra khi tạo nhóm QR trên hệ thống. Vui lòng thử lại!');
        setIsSaving(false);
        return; // Don't print if it fails
      }
      setIsSaving(false);
    }
    handlePrint();
  };

  return (
`;
content = content.replace("return (", executePrintLogic);

// Replace onClick={() => handlePrint()}
content = content.replace(
  "onClick={() => handlePrint()}",
  "onClick={executePrint}\n                disabled={isSaving}"
);
// Also update the label to reflect loading state
content = content.replace(
  "{isGrouped ? 'In 1 Tem G?p' : `In ${items.length} Tem A4`}",
  "{isSaving ? 'Đang tạo...' : isGrouped ? 'In 1 Tem Gộp' : `In ${items.length} Tem A4`}"
);

fs.writeFileSync(file, content, 'utf8');
console.log('BulkPrintQRModal updated');
