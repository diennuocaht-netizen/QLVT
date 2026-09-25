const fs = require('fs');
const file = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Get user profile
content = content.replace(
  "export const ShiftSchedule: React.FC = () => {",
  "import { useAuth } from '../contexts/AuthContext';\n\nexport const ShiftSchedule: React.FC = () => {\n  const { profile } = useAuth();\n  const canEdit = profile?.role === 'admin' || profile?.role === 'manager';"
);

// 2. Hide top actions if !canEdit
content = content.replace(
  "{viewMode === 'matrix' && (",
  "{viewMode === 'matrix' && canEdit && ("
);

// 3. Disable table inputs if !canEdit
content = content.replace(
  `onChange={(e) => handleShiftChange(emp.id, d.dateStr, e.target.value)}
                                className="w-full h-full border-0 bg-transparent text-center focus:ring-1 focus:ring-indigo-500 appearance-none font-bold text-sm cursor-pointer"`,
  `onChange={(e) => handleShiftChange(emp.id, d.dateStr, e.target.value)}
                                disabled={!canEdit}
                                className={\`w-full h-full border-0 bg-transparent text-center focus:ring-1 focus:ring-indigo-500 appearance-none font-bold text-sm \${canEdit ? 'cursor-pointer' : 'cursor-default'}\`}`
);
content = content.replace(
  `value={editedEmployees[emp.id]?.full_name ?? emp.full_name}
                            onChange={(e) => setEditedEmployees(prev => ({ ...prev, [emp.id]: { ...prev[emp.id], full_name: e.target.value } }))}
                          />`,
  `value={editedEmployees[emp.id]?.full_name ?? emp.full_name}
                            onChange={(e) => setEditedEmployees(prev => ({ ...prev, [emp.id]: { ...prev[emp.id], full_name: e.target.value } }))}
                            readOnly={!canEdit}
                          />`
);
content = content.replace(
  `value={editedEmployees[emp.id]?.role ?? emp.role ?? ''}
                            onChange={(e) => setEditedEmployees(prev => ({ ...prev, [emp.id]: { ...prev[emp.id], role: e.target.value } }))}
                          />`,
  `value={editedEmployees[emp.id]?.role ?? emp.role ?? ''}
                            onChange={(e) => setEditedEmployees(prev => ({ ...prev, [emp.id]: { ...prev[emp.id], role: e.target.value } }))}
                            readOnly={!canEdit}
                          />`
);

// Disable Delete button
content = content.replace(
  `<td className="border border-gray-300 p-1 text-center bg-gray-50">
                          <button 
                            onClick={() => handleDeleteEmployee(emp.id, emp.full_name)}
                            className="p-1 text-red-500 hover:bg-red-100 rounded"
                            title="Xóa nhân sự"
                          >`,
  `<td className="border border-gray-300 p-1 text-center bg-gray-50">
                          {canEdit && (
                            <button 
                              onClick={() => handleDeleteEmployee(emp.id, emp.full_name)}
                              className="p-1 text-red-500 hover:bg-red-100 rounded"
                              title="Xóa nhân sự"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>`
);

// Hide Delete button header
content = content.replace(
  `<th className="border border-gray-300 p-2 text-center bg-gray-50 w-10"></th>`,
  `{canEdit && <th className="border border-gray-300 p-2 text-center bg-gray-50 w-10"></th>}`
);

// 4. In sync, map job_title instead of role=''
content = content.replace(
  `role: '', 
          order_index: employees.length + index`,
  `role: u.job_title || '', 
          order_index: employees.length + index`
);

fs.writeFileSync(file, content, 'utf8');
console.log('ShiftSchedule updated');
