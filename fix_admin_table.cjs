const fs = require('fs');
const file = 'src/pages/Admin.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add "Chức danh" to headers
content = content.replace(
  '<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>',
  '<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>\n                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chức danh</th>'
);

// Add "Chức danh" input to the edit form in the first column
content = content.replace(
  `                            <select
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value as Role)}
                              className="block border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            >
                              <option value="viewer">Viewer</option>
                              <option value="manager">Manager</option>
                              <option value="admin">Admin</option>
                            </select>`,
  `                            <input
                              type="text"
                              value={editJobTitle}
                              onChange={(e) => setEditJobTitle(e.target.value)}
                              className="block w-32 border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                              placeholder="Chức danh..."
                            />`
);

// Add "Chức danh" cell in the row
content = content.replace(
  '<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>',
  '<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>\n                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.job_title || <span className="text-gray-300 italic">Chưa có</span>}</td>'
);


fs.writeFileSync(file, content, 'utf8');
console.log('OK');
