const fs = require('fs');
let content = fs.readFileSync('src/components/hr/ShiftTaskModal.tsx', 'utf8');

const completionUi = `
            {task?.status === 'done' && (
              <div className="col-span-1 md:col-span-2 mt-4 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center"><CheckCircle className="w-4 h-4 mr-1"/> Kết quả hoàn thành</h4>
                <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-gray-500 block mb-1">Người hoàn thành:</span>
                    <div className="flex flex-wrap gap-1">
                      {(task.completers || []).map((id, idx) => {
                        const user = users.find(u => u.id === id);
                        return <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded bg-white text-green-700 text-xs font-medium border border-green-200">{user ? user.display_name : 'Unknown'}</span>
                      })}
                      {(!task.completers || task.completers.length === 0) && <span className="text-sm text-gray-500">Chưa ghi nhận</span>}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-500 block mb-1">Ghi chú / Kết quả:</span>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{task.completion_note || 'Không có ghi chú'}</p>
                  </div>
                </div>
              </div>
            )}
          </form>`;

content = content.replace(/<\/form>/, completionUi);

// Disable updating if not authorized
const permLogic = `
  const canEditTask = !task || profile?.role === 'admin' || profile?.id === task.created_by || profile?.id === task.assignee_id || (task.completers || []).includes(profile?.id);
`;
if (!content.includes('canEditTask')) {
    content = content.replace(
        'const handleSubmit = async (e: React.FormEvent) => {',
        permLogic + '\n  const handleSubmit = async (e: React.FormEvent) => {'
    );
    
    // Add disabled to form inputs
    content = content.replace(/<input /g, '<input disabled={!canEditTask} ');
    content = content.replace(/<textarea /g, '<textarea disabled={!canEditTask} ');
    content = content.replace(/<select\s/g, '<select disabled={!canEditTask} ');
    
    // Hide update button
    content = content.replace(
        /<button\s+onClick=\{handleSubmit\}[\s\S]*?<\/button>/,
        `{canEditTask && (
            $&
          )}`
    );
}

fs.writeFileSync('src/components/hr/ShiftTaskModal.tsx', content, 'utf8');
console.log('ShiftTaskModal patched completely');
