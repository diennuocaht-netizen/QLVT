const fs = require('fs');
const filename = 'src/pages/HRTasks.tsx';
let content = fs.readFileSync(filename, 'utf8');

// The exact block to replace
const target = `
          <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
            {canEdit && (
                <>
                  <button
                    className="inline-flex items-center justify-center gap-1.5 px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 shadow-sm transition-colors border border-gray-200"
                    onClick={() => setIsRoutineModalOpen(true)}
                    title="C?u hnh Checklist cho ca"
                  >
                    <Settings size={18} />
                    C?u hnh
                  </button>
                  <button
                    className="inline-flex items-center justify-center gap-1.5 px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 shadow-sm transition-colors"
                    onClick={generateRoutineTasks}
                    title="T? d?ng t?o Checklist da c?u hnh cho ca"
                  >
                    <FileText size={18} />
                    <span className="hidden sm:inline">Checklist</span></button>
                </>
              )}
            <button
              className="inline-flex items-center justify-center gap-1.5 px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm transition-colors whitespace-nowrap"
              onClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
            >
              <Plus size={18} />
              T?o cng vi?c
            </button>
          </div>
`;

// It might have Windows CRLF, so let's use regex that ignores exact whitespace.
content = content.replace(/<div className="flex flex-wrap gap-2 mt-2 md:mt-0">[\s\S]*?T\?o cng vi\?c\s*<\/button>\s*<\/div>/, `
          <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
            {canEdit && (
                <>
                  <button
                    className="inline-flex items-center justify-center gap-1.5 px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 shadow-sm transition-colors border border-gray-200"
                    onClick={() => setIsRoutineModalOpen(true)}
                    title="Cấu hình Checklist cho ca"
                  >
                    <Settings size={16} />
                    <span className="hidden md:inline">Cấu hình</span>
                  </button>
                  <button
                    className="inline-flex items-center justify-center gap-1.5 px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 shadow-sm transition-colors"
                    onClick={generateRoutineTasks}
                    title="Tự động tạo Checklist đã cấu hình cho ca"
                  >
                    <FileText size={16} />
                    <span className="hidden md:inline">Checklist</span>
                  </button>
                </>
              )}
            <button
              className="inline-flex items-center justify-center gap-1.5 px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm transition-colors whitespace-nowrap"
              onClick={() => { setEditingTask(null); setIsTaskModalOpen(true); }}
            >
              <Plus size={16} />
              <span className="hidden md:inline">Tạo công việc</span>
              <span className="md:hidden">Tạo mới</span>
            </button>
          </div>
`);

fs.writeFileSync(filename, content, 'utf8');
console.log('Fixed HRTasks block');
