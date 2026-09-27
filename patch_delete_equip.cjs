const fs = require('fs');
const file = 'src/pages/MeasuredEquipments.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldBlock = `<button onClick={() => setViewingDetailsItem(item)} className="text-blue-600 hover:text-blue-900 mr-3" title="Chi ti\u1ebft">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleOpenModal(item)} className="text-indigo-600 hover:text-indigo-900 mr-3" title="S\u1eeda">
                          <Edit className="w-4 h-4" />
                        </button>`;

const newBlock = `<button onClick={() => setViewingDetailsItem(item)} className="text-blue-600 hover:text-blue-900 mr-3" title="Chi ti\u1ebft">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleOpenModal(item)} className="text-indigo-600 hover:text-indigo-900 mr-3" title="S\u1eeda">
                          <Edit className="w-4 h-4" />
                        </button>
                        {profile?.role === 'admin' && (
                          <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900" title="X\u00f3a">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}`;

if (content.includes(oldBlock)) {
  content = content.replace(oldBlock, newBlock);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Replaced block exactly');
} else {
  console.log('Block not found using exact match, trying regex...');
  
  // Try finding it with regex
  const regex = /<button onClick=\{\(\) => handleOpenModal\(item\)\} className="text-indigo-600 hover:text-indigo-900 mr-3" title="[^"]+">\s*<Edit className="w-4 h-4" \/>\s*<\/button>/;
  const newButton = `
                        {profile?.role === 'admin' && (
                          <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900" title="X\u00f3a">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}`;
  
  if (regex.test(content)) {
    content = content.replace(regex, "$&" + newButton);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Replaced block via regex');
  } else {
    console.log('Failed to find block via regex as well.');
  }
}

