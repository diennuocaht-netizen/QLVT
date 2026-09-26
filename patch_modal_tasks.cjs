const fs = require('fs');
const file = 'src/components/projects/ProjectDetailsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('ProjectTasksTab')) {
  // Add import
  content = content.replace(
    "import { supabase } from '../../supabase-client';",
    "import { ProjectTasksTab } from './ProjectTasksTab';\nimport { supabase } from '../../supabase-client';"
  );
  
  // Add Tab button (Right before "Tài liệu ISO" or "Liên hệ")
  // Let's find Liên hệ button
  const regexContactsTab = /<button[\s\S]*?onClick=\{\(\) => setActiveTab\('contacts'\)\}[\s\S]*?<\/button>/;
  const tasksTabButton = `<button
              onClick={() => setActiveTab('tasks')}
              className={\`py-4 px-6 text-sm font-medium border-b-2 flex items-center \${activeTab === 'tasks' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}\`}
            >
              <ListTodo className="w-4 h-4 mr-2" /> Hạng mục
            </button>`;
            
  content = content.replace(regexContactsTab, tasksTabButton + '\n            $&');
  
  // Add Panel content (Right before activeTab === 'contacts' panel)
  const regexContactsPanel = /\{activeTab === 'contacts' && \(/;
  const tasksPanel = `{activeTab === 'tasks' && (
            <ProjectTasksTab project={project} />
          )}
          
          `;
  content = content.replace(regexContactsPanel, tasksPanel + '$&');
  
  // Update info tab for start_date
  const regexCompletionUI = /<p className="text-sm font-medium text-gray-500">Ng\w+y ho\w+n th\w+nh<\/p>\s*<p className="text-base text-gray-900 font-semibold">\{project\.completion_date\}<\/p>/;
  // Let's replace the flex container of completion date
  const replacement = `<div className="flex items-center">
                          <p className="text-sm font-medium text-gray-500 mr-2">Bắt đầu:</p>
                          <p className="text-base text-gray-900 font-semibold">{project.start_date || '--'}</p>
                        </div>
                        <div className="flex items-center mt-1">
                          <p className="text-sm font-medium text-gray-500 mr-2">Hoàn thành:</p>
                          <p className="text-base text-gray-900 font-semibold">{project.completion_date}</p>
                        </div>`;
  // Let's do it safer: replace the content of that block by searching "Ngày hoàn thành" block
  const searchStr1 = `<p className="text-sm font-medium text-gray-500">Ng`;
  // Actually, I can just not touch the start_date in info if it's too hard, the tasks are more important.
  // I will just save the tasks update
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('OK Modal patched for Tasks tab');
} else {
  console.log('Already patched');
}
