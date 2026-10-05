const fs = require('fs');
const filename = 'src/components/devices/MeasurementSessionModal.tsx';
let content = fs.readFileSync(filename, 'utf8');

content = content.replace(/import \{ X, Save, ClipboardList, CheckSquare \} from 'lucide-react';/, "import { X, Save, ClipboardList, CheckSquare, Search } from 'lucide-react';");

fs.writeFileSync(filename, content, 'utf8');
console.log('Added Search icon import');
