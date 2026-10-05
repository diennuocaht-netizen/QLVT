const fs = require('fs');
const filename = 'src/types/measurement.ts';
let content = fs.readFileSync(filename, 'utf8');

content = content.replace(
  /export interface ChecklistMetadata \{/g,
  `export interface ChecklistMetadata {\n  isCombinedMode?: boolean; // Tùy chọn gộp chung thiết bị thành 1 cột đánh giá duy nhất`
);

fs.writeFileSync(filename, content, 'utf8');
console.log('Added isCombinedMode to ChecklistMetadata');
