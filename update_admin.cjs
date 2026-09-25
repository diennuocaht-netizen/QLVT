const fs = require('fs');
const file = 'src/pages/Admin.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add editJobTitle state
if (!content.includes('const [editJobTitle, setEditJobTitle]')) {
  content = content.replace(
    "const [editRole, setEditRole] = useState<Role>('viewer');",
    "const [editRole, setEditRole] = useState<Role>('viewer');\n  const [editJobTitle, setEditJobTitle] = useState('');"
  );
}

// 2. Update newUser state
if (!content.includes('jobTitle:')) {
  content = content.replace(
    "role: 'viewer' as Role }",
    "role: 'viewer' as Role, jobTitle: '' }"
  );
  content = content.replace(
    "role: 'viewer' }",
    "role: 'viewer', jobTitle: '' }"
  );
}

// 3. Update startEditingName
content = content.replace(
  "setEditRole(user.role);",
  "setEditRole(user.role);\n    setEditJobTitle(user.job_title || '');"
);

// 4. Update saveName
content = content.replace(
  "display_name: editName, role: editRole",
  "display_name: editName, role: editRole, job_title: editJobTitle"
);

// 5. Update admin_create_user_bypass usage if possible, but actually we can just update the user right after if the RPC doesn't support it yet.
// Let's look at handleCreateUser:
// const { data: rpcData, error: profileError } = await supabase.rpc('admin_create_user_bypass', ...
// Since we don't want to force them to recreate the RPC right away if they don't want to, we can just do an update after creation.
content = content.replace(
  `const { data: rpcData, error: profileError } = await supabase.rpc('admin_create_user_bypass', {
        p_email: newUser.email,
        p_password: newUser.password,
        p_display_name: newUser.displayName || newUser.email.split('@')[0],
        p_role: newUser.role
      });`,
  `const { data: rpcData, error: profileError } = await supabase.rpc('admin_create_user_bypass', {
        p_email: newUser.email,
        p_password: newUser.password,
        p_display_name: newUser.displayName || newUser.email.split('@')[0],
        p_role: newUser.role
      });
      
      // Attempt to set job_title if RPC doesn't support it yet
      if (!profileError && newUser.jobTitle) {
        try {
          // Find the new user's ID by email
          const { data: createdUser } = await supabase.from('users').select('id').eq('email', newUser.email.toLowerCase()).single();
          if (createdUser) {
            await supabase.from('users').update({ job_title: newUser.jobTitle }).eq('id', createdUser.id);
          }
        } catch (e) {}
      }`
);

// 6. Update the Table Headers
content = content.replace(
  `<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên hiển thị</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phân quyền</th>`,
  `<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên hiển thị</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chức danh</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phân quyền</th>`
);

// 7. Update Table Rows
content = content.replace(
  `<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {editingUserId === user.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      ) : (
                        user.display_name
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingUserId === user.id ? (`,
  `<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {editingUserId === user.id ? (
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      ) : (
                        user.display_name
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingUserId === user.id ? (
                        <input
                          type="text"
                          value={editJobTitle}
                          onChange={(e) => setEditJobTitle(e.target.value)}
                          placeholder="Kỹ sư, v.v..."
                          className="border border-gray-300 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      ) : (
                        user.job_title || <span className="text-gray-300 italic">Chưa có</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editingUserId === user.id ? (`
);

// 8. Add jobTitle to Create Modal
content = content.replace(
  `<div>
                  <label className="block text-sm font-medium text-gray-700">Tên hiển thị (Tùy chọn)</label>
                  <input
                    type="text"
                    value={newUser.displayName}
                    onChange={(e) => setNewUser({...newUser, displayName: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="VD: Nguyen Van A"
                  />
                </div>`,
  `<div>
                  <label className="block text-sm font-medium text-gray-700">Tên hiển thị (Tùy chọn)</label>
                  <input
                    type="text"
                    value={newUser.displayName}
                    onChange={(e) => setNewUser({...newUser, displayName: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="VD: Nguyen Van A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Chức danh công việc (Tùy chọn)</label>
                  <input
                    type="text"
                    value={newUser.jobTitle}
                    onChange={(e) => setNewUser({...newUser, jobTitle: e.target.value})}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="VD: Kỹ sư Nước"
                  />
                </div>`
);


fs.writeFileSync(file, content, 'utf8');
console.log('Admin updated');
