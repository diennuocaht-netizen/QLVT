const fs = require('fs');

const filename = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(filename, 'utf8');

// The action buttons wrapper:
// Currently: <div className="hidden lg:flex flex-wrap gap-2 text-xs">\n              {canEdit && (
content = content.replace(/<div className="hidden lg:flex flex-wrap gap-2 text-xs">\s*\{canEdit && \(/, '<div className="flex flex-wrap gap-2 text-xs">\n              {canEdit && (');

// The legend wrapper:
// Currently: <div className="hidden lg:flex flex-wrap gap-2 text-xs">\n            {shiftTypes.map
content = content.replace(/<div className="hidden lg:flex flex-wrap gap-2 text-xs">\s*\{shiftTypes.map/g, '<div className="hidden xl:flex flex-wrap gap-2 text-xs">\n            {shiftTypes.map');

fs.writeFileSync(filename, content, 'utf8');
console.log('Fixed wrappers');
