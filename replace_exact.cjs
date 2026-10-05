const fs = require('fs');
const filename = 'src/pages/HRTasks.tsx';
let content = fs.readFileSync(filename, 'utf8');

const startStr = '<div className="flex flex-wrap gap-2 mt-2 md:mt-0">';
const endStr = '</button>\n          </div>\n        </div>';

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const replacement = `
          <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
            {canEdit && (
                <>
                  <button
                    className="inline-flex items-center justify-center gap-1.5 px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 shadow-sm transition-colors border border-gray-200"
                    onClick={() => setIsRoutineModalOpen(true)}
                    title="Cấu hình Checklist cho ca"
                  >
                    <Settings size={16} />
                    <span className="hidden sm:inline">Cấu hình</span>
                  </button>
                  <button
                    className="inline-flex items-center justify-center gap-1.5 px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 shadow-sm transition-colors"
                    onClick={generateRoutineTasks}
                    title="Tự động tạo Checklist đã cấu hình cho ca"
                  >
                    <FileText size={16} />
                    <span className="hidden sm:inline">Checklist</span>
                  </button>
                </>
              )}
            <button
              className="inline-flex items-center justify-center gap-1.5 px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm transition-colors whitespace-nowrap"
              onClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Tạo công việc</span>
              <span className="sm:hidden">Tạo mới</span>
`;
  content = content.substring(0, startIndex) + replacement.trim() + content.substring(endIndex);
  fs.writeFileSync(filename, content, 'utf8');
  console.log('Spliced successfully!');
} else {
  console.log('Could not find start or end bounds');
}
