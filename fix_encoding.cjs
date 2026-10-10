const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/ReconciliationModal.tsx', 'utf8');

content = content.replace(/Cch 1:/g, 'Cách 1:');
content = content.replace(/Ch\?n kho\?ng th\?i gian tru\?c khi import file\./g, 'Chọn khoảng thời gian trước khi import file.');
content = content.replace(/Vui lng ch\?n kho\?ng th\?i gian d\?i sot tru\?c khi import file!/g, 'Vui lòng chọn khoảng thời gian đối soát trước khi import file!');
content = content.replace(/Chua c d\? li\?u d\?i sot\. Vui lng import file Bravo\./g, 'Chưa có dữ liệu đối soát. Vui lòng import file hoặc chọn từ mẫu.');

fs.writeFileSync('src/components/inventory/ReconciliationModal.tsx', content, 'utf8');
