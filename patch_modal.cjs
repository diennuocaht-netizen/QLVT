const fs = require('fs');
let content = fs.readFileSync('src/components/hr/ShiftTaskModal.tsx', 'utf8');

// Inject read-only completion info
const completionUi = `
            {task?.status === 'done' && (
              <div className="col-span-2 mt-4 pt-4 border-t border-gray-100">
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
`;

if (!content.includes('Kết quả hoàn thành')) {
  // Find where to inject, probably right before the form buttons
  content = content.replace(
    /<\/div>\s*<\/div>\s*<div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end space-x-3 rounded-b-xl">/,
    match => completionUi + match
  );
  
  if (!content.includes('CheckCircle')) {
      content = content.replace(
          "Layers } from 'lucide-react';",
          "Layers, CheckCircle } from 'lucide-react';"
      );
  }
  
  fs.writeFileSync('src/components/hr/ShiftTaskModal.tsx', content, 'utf8');
  console.log('ShiftTaskModal patched with completion info');
}
