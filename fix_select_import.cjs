const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/AuditModal.tsx', 'utf8');

if (!content.includes("import Select from 'react-select'")) {
  content = content.replace(
    "import React, { useState, useEffect } from 'react';",
    "import React, { useState, useEffect } from 'react';\nimport Select from 'react-select';"
  );
  fs.writeFileSync('src/components/inventory/AuditModal.tsx', content, 'utf8');
  console.log('Fixed missing Select import');
}
