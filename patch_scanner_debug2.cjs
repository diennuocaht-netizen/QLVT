const fs = require('fs');
const file = 'src/components/inventory/QRScannerModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const startStr = '<div className="mt-4 p-2 bg-gray-100 rounded text-xs text-left overflow-auto break-all">';
const endStr = '</div>';

const startIdx = content.indexOf(startStr);
if (startIdx !== -1) {
    const endIdx = content.indexOf(endStr, startIdx);
    if (endIdx !== -1) {
        const newBlock = `<div className="mt-4 p-2 bg-gray-100 rounded text-xs text-left overflow-auto break-all">
                  <strong>Chuỗi quét được:</strong> {debugText}<br/>
                  {debugText.startsWith('GRP:') ? (
                     <strong>Đang tải dữ liệu từ nhóm...</strong>
                  ) : (
                     <><strong>Mã trích xuất:</strong> {debugText.substring(6).split(',').map(c => c.trim()).join(' | ')}</>
                  )}<br/>
                  {debugError && <strong className="text-red-500">Lỗi: {debugError}</strong>}
                </div>`;
        content = content.substring(0, startIdx) + newBlock + content.substring(endIdx + endStr.length);
        fs.writeFileSync(file, content, 'utf8');
        console.log('Replaced debug block properly');
    }
} else {
    console.log('Could not find startStr');
}
