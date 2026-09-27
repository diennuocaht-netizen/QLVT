const fs = require('fs');
const file = 'src/components/inventory/BulkPrintQRModal.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import React, { useRef, useState } from 'react';", "import React, { useRef, useState, useEffect } from 'react';");
fs.writeFileSync(file, content, 'utf8');
console.log('Imported useEffect');
