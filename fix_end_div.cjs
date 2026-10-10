const fs = require('fs');
let content = fs.readFileSync('src/pages/InventorySettings.tsx', 'utf8');

content = content.replace(
  /\n      <\/div>\n    <\/div>\n  \);\n\};\n/,
  "\n      </div>\n      </div>\n    </div>\n  );\n};\n"
);

fs.writeFileSync('src/pages/InventorySettings.tsx', content, 'utf8');
