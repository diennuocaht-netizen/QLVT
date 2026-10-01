const fs = require('fs');
let content = fs.readFileSync('src/pages/HRTasks.tsx', 'utf8');

const multiSelectUi = `
              <div className="mt-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Người hoàn thành (Có thể chọn nhiều)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedCompleters.map(userId => {
                    const user = users.find(u => u.id === userId);
                    return (
                      <span key={userId} className="inline-flex items-center px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-xs font-medium border border-indigo-100">
                        {user ? (user.display_name || user.email) : 'Unknown'}
                        <button type="button" onClick={() => setSelectedCompleters(prev => prev.filter(id => id !== userId))} className="ml-1 text-indigo-400 hover:text-indigo-600">
                          <X size={12} />
                        </button>
                      </span>
                    );
                  })}
                </div>
                <select
                  value=""
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && !selectedCompleters.includes(val)) {
                      setSelectedCompleters([...selectedCompleters, val]);
                    }
                  }}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  <option value="">-- Chọn thêm người hoàn thành --</option>
                  {users.filter(u => !selectedCompleters.includes(u.id)).map(u => (
                    <option key={u.id} value={u.id}>{u.display_name || u.email}</option>
                  ))}
                </select>
              </div>`;

if (!content.includes('Người hoàn thành (Có thể chọn nhiều)')) {
  // Regex to match the entire completionNote div
  const uiRegex = /(<div className="relative">[\s\S]*?<FileText[\s\S]*?<textarea[\s\S]*?\/>\s*<\/div>\s*<\/div>)/;
  content = content.replace(uiRegex, (match) => match + multiSelectUi);
  fs.writeFileSync('src/pages/HRTasks.tsx', content, 'utf8');
  console.log('UI injected');
} else {
  console.log('Already injected');
}
