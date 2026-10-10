const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/ReconciliationModal.tsx', 'utf8');

content = content.replace(
  /slip\.status === SlipStatus\.Completed \|\| slip\.status === SlipStatus\.Closed/,
  "slip.status === 'Đã hoàn thành' || slip.status === 'Đã đóng'"
);

content = content.replace(
  /, SlipStatus }/,
  " }"
);

fs.writeFileSync('src/components/inventory/ReconciliationModal.tsx', content, 'utf8');
