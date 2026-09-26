const fs = require('fs');
const file = 'src/components/projects/ProjectTasksTab.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add logActivity import
content = content.replace(
  "import { Plus, Trash2, Save, ListTodo, AlertCircle, Clock } from 'lucide-react';",
  "import { Plus, Trash2, Save, ListTodo, AlertCircle, Clock, User } from 'lucide-react';\nimport { logActivity } from '../../utils/activityLogger';"
);

// 2. Add users state and fetch logic
const usersState = `  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase.from('users').select('*').order('display_name');
      if (data) setUsers(data);
    };
    fetchUsers();
  }, []);
  
`;
content = content.replace(
  "useEffect(() => {",
  usersState + "useEffect(() => {"
);

// 3. Update task template to include assignee
content = content.replace(
  "status: 'pending' }",
  "status: 'pending', assignee: '' }"
);

// 4. Update saveTasks to include logActivity
const saveLogic = `if (error) throw error;
      await logActivity({
        action: \`Cập nhật hạng mục công việc cho dự án \${project.code}\`,
        entityType: 'project',
        entityId: project.id,
        details: { tasks_count: tasks.length }
      });
      alert('Đã lưu các thay đổi hạng mục công việc');`;
content = content.replace(
  "if (error) throw error;\n      alert('Đã lưu các thay đổi hạng mục công việc');",
  saveLogic
);

// 5. Add UI field for Assignee
// Replace grid layout from md:col-span-12 to accommodate Assignee
// We have: name (12), start (3), end (3), progress (3), status (3) -> total 12.
// Let's change name to col-span-9 and add Assignee col-span-3!
const nameCol = `<div className="md:col-span-12 pr-6">`;
const nameColNew = `<div className="md:col-span-9">`;
content = content.replace(nameCol, nameColNew);

// Now we need to insert the Assignee block after Name block
const nameBlockRegex = /<input[\s\S]*?value=\{task\.name\}[\s\S]*?\/>\s*<\/div>/;
const assigneeBlock = `
                <div className="md:col-span-3">
                  <label className="block text-xs font-medium text-gray-700">Người phụ trách</label>
                  <div className="relative mt-1">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <select
                      value={task.assignee || ''}
                      onChange={(e) => updateTask(index, 'assignee', e.target.value)}
                      className="block w-full pl-8 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                    >
                      <option value="">-- Chưa gán --</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.display_name || u.email}</option>
                      ))}
                    </select>
                  </div>
                </div>`;
content = content.replace(nameBlockRegex, "$&" + assigneeBlock);

fs.writeFileSync(file, content, 'utf8');
console.log('ProjectTasksTab updated with assignee and logging');
