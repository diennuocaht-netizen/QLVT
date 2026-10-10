const fs = require('fs');
let content = fs.readFileSync('src/components/inventory/AuditModal.tsx', 'utf8');

// Add Trash2 to imports if not present
if (!content.includes('Trash2')) {
  content = content.replace(
    /import \{ X, FileText, Upload, Save, AlertCircle \} from 'lucide-react';/,
    "import { X, FileText, Upload, Save, AlertCircle, Trash2 } from 'lucide-react';"
  );
}

// Add handleRemoveLine function
const handleRemoveLineCode = `
  const handleRemoveLine = (index: number) => {
    setAuditLines(prev => prev.filter((_, i) => i !== index));
  };
`;
if (!content.includes('handleRemoveLine')) {
  content = content.replace(
    /const handleActualStockChange =/,
    handleRemoveLineCode + '\n  const handleActualStockChange ='
  );
}

// Add the column header
content = content.replace(
  /<th className="px-4 py-3 text-left font-semibold text-gray-700">Ghi Chú<\/th>\s*<\/tr>/,
  '<th className="px-4 py-3 text-left font-semibold text-gray-700">Ghi Chú</th>\n                      <th className="px-4 py-3 text-center w-12"></th>\n                    </tr>'
);

// Add the cell with the trash button
const actionCell = `
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(line.originalIndex)}
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded"
                              title="Loại bỏ khỏi phiếu"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
`;
content = content.replace(
  /<\/td>\s*<\/tr>\s*\)\)/,
  actionCell + '                      ))'
);

// We need to update colSpan if the table is empty
content = content.replace(
  /<td colSpan=\{6\} className="px-4 py-8 text-center text-gray-500">/,
  '<td colSpan={7} className="px-4 py-8 text-center text-gray-500">'
);

fs.writeFileSync('src/components/inventory/AuditModal.tsx', content, 'utf8');
console.log('Added remove line button');
