const fs = require('fs');
const file = 'src/components/inventory/QRScannerModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add supabase import
content = content.replace(
  "import { X, Camera } from 'lucide-react';",
  "import { X, Camera, Layers } from 'lucide-react';\nimport { supabase } from '../../supabase-client';"
);

// 2. Add states for MULTI QR
content = content.replace(
  "const scannerRegionId = \"qr-reader\";",
  `const scannerRegionId = "qr-reader";
  const [multiVariants, setMultiVariants] = useState<any[] | null>(null);
  const [loadingMulti, setLoadingMulti] = useState(false);`
);

// 3. Modify success callback
const oldCallback = `        (decodedText) => {
          // Success callback
          if (scannerRef.current) {
            scannerRef.current.stop().then(() => {
              onScanSuccess(decodedText);
              onClose();
            }).catch(console.error);
          }
        },`;
        
const newCallback = `        (decodedText) => {
          // Success callback
          if (scannerRef.current) {
            scannerRef.current.stop().then(async () => {
              if (decodedText.startsWith('MULTI:')) {
                const codes = decodedText.substring(6).split(',').map(c => c.trim());
                setLoadingMulti(true);
                setMultiVariants([]); // trigger UI change
                try {
                  const { data } = await supabase
                    .from('inventory_items')
                    .select('id, code, name, unit, category, specifications')
                    .in('code', codes);
                  if (data) {
                    setMultiVariants(data);
                  }
                } catch (e) {
                  console.error(e);
                } finally {
                  setLoadingMulti(false);
                }
              } else {
                onScanSuccess(decodedText);
                onClose();
              }
            }).catch(console.error);
          }
        },`;
content = content.replace(oldCallback, newCallback);

// 4. Modify return UI to handle multiVariants state
const endDivRegex = /<\/div>\s*<\/div>\s*\);\s*\};/m;
const match = content.match(endDivRegex);

if (match) {
  const multiVariantsUI = `
      {multiVariants !== null && (
        <div className="absolute inset-0 z-50 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-indigo-50 flex-shrink-0 shadow-sm">
            <h2 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
              <Layers className="text-indigo-600" size={20} />
              Chọn vật tư từ Mã Gộp
            </h2>
            <button onClick={() => { setMultiVariants(null); startScanner(); }} className="p-2 hover:bg-indigo-100 rounded-full text-indigo-500 transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {loadingMulti ? (
              <div className="flex justify-center items-center h-full">
                <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : multiVariants.length === 0 ? (
              <div className="text-center text-gray-500 mt-10">Không tìm thấy dữ liệu vật tư nào trong mã này.</div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-4 text-center">Hệ thống phát hiện {multiVariants.length} loại vật tư trong mã QR này. Vui lòng chọn một loại:</p>
                {multiVariants.map(variant => (
                  <button 
                    key={variant.code}
                    onClick={() => {
                      onScanSuccess(variant.code);
                      onClose();
                    }}
                    className="w-full text-left bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-indigo-500 hover:shadow-md transition-all flex flex-col gap-1 active:scale-95"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-gray-900">{variant.name}</span>
                      <span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded text-gray-600">{variant.code}</span>
                    </div>
                    {variant.specifications && (
                      <span className="text-sm text-gray-500">{variant.specifications}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}`;
      
  content = content.replace(endDivRegex, multiVariantsUI + '\n' + match[0]);
}

fs.writeFileSync(file, content, 'utf8');
console.log('OK QRScannerModal');
