const fs = require('fs');
const file = 'src/pages/HRTasks.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add states and fetchUsers
if (!content.includes('const [users,')) {
  content = content.replace(
    'const [completionNote, setCompletionNote] = useState(\'\');',
    'const [completionNote, setCompletionNote] = useState(\'\');\n  const [users, setUsers] = useState<any[]>([]);\n  const [selectedCompleters, setSelectedCompleters] = useState<string[]>([]);'
  );
}

// 2. Fetch users
if (!content.includes('fetchUsers()')) {
  content = content.replace(
    'fetchShiftTypes();\n  }, []);',
    'fetchShiftTypes();\n    fetchUsers();\n  }, []);'
  );
  content = content.replace(
    'const fetchShiftTypes',
    'const fetchUsers = async () => { const { data } = await supabase.from(\'users\').select(\'id, display_name, email\'); if (data) setUsers(data); };\n  const fetchShiftTypes'
  );
}

// 3. Update completion onClick
content = content.replace(
  /setCompletionNote\(''\);\s*setCompletingTask\(task\);/,
  "setCompletionNote(''); setSelectedCompleters(task.assignee_id ? [task.assignee_id] : []); setCompletingTask(task);"
);

// 4. handleCompleteTask update
const oldCompleteTask = /const handleCompleteTask = async \(\) => \{[\s\S]*?fetchTasks\(\);\s*\} catch \(err: any\) \{/m;
const newCompleteTask = `const handleCompleteTask = async () => {
    if (!completingTask) return;
    setLoading(true);
    try {
      // Don't append note to description anymore, use new columns
      const { error } = await supabase.from('hr_shift_tasks').update({ 
        status: 'done',
        completion_note: completionNote.trim() || null,
        completers: selectedCompleters,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).eq('id', completingTask.id);
      
      if (error) throw error;
      
      setCompletingTask(null);
      fetchTasks();
    } catch (err: any) {`;
content = content.replace(oldCompleteTask, newCompleteTask);

// 5. Add multi-select UI in the completion modal
const uiRegex = /<textarea[\s\S]*?<\/textarea>\s*<\/div>\s*<\/div>/m;
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
  content = content.replace(uiRegex, (match) => match + multiSelectUi);
}

// 6. Modal header fix: Change text-green-400 to text-gray-400 to match design usually
content = content.replace(
  'className="text-green-400 hover:text-green-600',
  'className="text-gray-400 hover:text-gray-600'
);

fs.writeFileSync(file, content, 'utf8');
console.log('HRTasks logic patched for completion');
