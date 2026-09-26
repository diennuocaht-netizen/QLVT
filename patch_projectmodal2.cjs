const fs = require('fs');
const file = 'src/components/projects/ProjectDetailsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Insert the tab button for tasks
const contactTabRegex = /<button\s*onClick=\{\(\) => setActiveTab\('contacts'\)\}/;
if (contactTabRegex.test(content) && !content.includes("setActiveTab('tasks')")) {
  const tabTasksBtn = `<button
              onClick={() => setActiveTab('tasks')}
              className={\`py-4 px-6 text-sm font-medium border-b-2 flex items-center \${activeTab === 'tasks' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}\`}
            >
              <ListTodo className="w-4 h-4 mr-2" /> Hạng mục ({project.tasks?.length || 0})
            </button>
            `;
  content = content.replace(contactTabRegex, tabTasksBtn + "$&");
}

// Ensure the start date is shown in info tab
const completionDateUI = `<p className="text-sm font-medium text-gray-500">NgAy hoAn thAnh</p>
                        <p className="text-base text-gray-900 font-semibold">{project.completion_date}</p>`;
// Let's use string operations carefully for info tab.
const completionIdx = content.indexOf('project.completion_date');
if (completionIdx !== -1 && !content.includes('project.start_date')) {
  // Find start of div containing this block. It's inside a flex items-center
  // Instead of replacing the whole block, I will just prepend a new div block before the completion_date block.
  // Actually, I can just replace the whole modal content with a properly built one, but that's risky.
}

fs.writeFileSync(file, content, 'utf8');
console.log('patched tabs');
