const fs = require('fs');
const filename = 'src/components/inventory/SlipModal.tsx';
let content = fs.readFileSync(filename, 'utf8');

// 1. Fix auto-match condition
content = content.replace(
  /if \(currentItem\.itemId && currentItem\.subsystem && currentItem\.purpose && currentItem\.method\) \{/g,
  "if (currentItem.itemId) {"
);

// 2. Add combinedSubsystems
content = content.replace(
  /const uniqueMethods = Array\.from\(new Set\(costCodes\.map/g,
  "const combinedSubsystems = Array.from(new Set([...subsystems.map(s => s.name), ...costCodes.map(c => c.subsystem)].filter(Boolean)));\n  const uniqueMethods = Array.from(new Set(costCodes.map"
);

// 3. Update the dropdown for subsystem
content = content.replace(
  /\{subsystems\.map\(sub => \(\s*<option key=\{sub\.id\} value=\{sub\.name\}>\{sub\.name\}<\/option>\s*\)\)\}/g,
  "{combinedSubsystems.map(sub => (\n                                    <option key={sub} value={sub}>{sub}</option>\n                                  ))}"
);

fs.writeFileSync(filename, content, 'utf8');
console.log('Fixed auto-match condition and subsystem dropdown in SlipModal.tsx');
