const fs = require('fs');
const file = 'src/pages/Admin.tsx';
let content = fs.readFileSync(file, 'utf8');

// Remove the editJobTitle input from the first cell
content = content.replace(
  `                              <input
                                type="text"
                                value={editJobTitle}
                                onChange={(e) => setEditJobTitle(e.target.value)}
                                className="block w-32 border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                placeholder="Chức danh..."
                              />`,
  ""
);

// Add the editJobTitle input to the third cell
content = content.replace(
  '<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.job_title || <span className="text-gray-300 italic">Chưa có</span>}</td>',
  `<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingUserId === user.id ? (
                      <input
                        type="text"
                        value={editJobTitle}
                        onChange={(e) => setEditJobTitle(e.target.value)}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="Chức danh..."
                      />
                    ) : (
                      user.job_title || <span className="text-gray-300 italic">Chưa có</span>
                    )}
                  </td>`
);

fs.writeFileSync(file, content, 'utf8');
console.log('OK');
