const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/DetailAuditModal.tsx', 'utf8');

// The problematic string starts right after `) : (`
content = content.replace(
  /\) :\s*\(\s*<div className="flex flex-col sm:flex-row/,
  `) : (
              <>
                <div className="flex flex-col sm:flex-row`
);

// And we need to close the fragment where the table/overflow div closes.
// Let's find the end of the overflow div.
// It closes around `</table>\n                </div>\n              )}`
content = content.replace(
  /<\/table>\s*<\/div>\s*\)\}/,
  `</table>
                </div>
              </>
            )}`
);

fs.writeFileSync('src/components/inventory/DetailAuditModal.tsx', content, 'utf8');
console.log('Fixed Fragment error');
