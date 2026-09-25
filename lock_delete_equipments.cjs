const fs = require('fs');
const file = 'src/pages/MeasuredEquipments.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = `<button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900" title="Xóa">
                        <Trash2 className="w-4 h-4" />
                      </button>`;
// It might be encoded differently, so regex
content = content.replace(/<button onClick=\{\(\) => handleDelete\(item\.id\)\}[\s\S]*?<\/button>/m, '');

fs.writeFileSync(file, content, 'utf8');
console.log('OK');
