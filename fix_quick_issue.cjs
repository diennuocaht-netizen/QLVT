const fs = require('fs');
const filename = 'src/components/inventory/QuickIssueModal.tsx';
let content = fs.readFileSync(filename, 'utf8');

content = content.replace(
  /if \(item && formData\.subsystem && formData\.purpose && formData\.method\) \{/g,
  "if (item) {"
);

fs.writeFileSync(filename, content, 'utf8');
console.log('Fixed QuickIssueModal auto match condition');
