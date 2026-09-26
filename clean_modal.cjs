const fs = require('fs');
const file = 'src/components/projects/ProjectDetailsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// The file has multiple {activeTab === 'tasks' && (
// Let's remove the first one which is the read-only one.
const tasksBlockStart = "{activeTab === 'tasks' && (\n              <div className=\"space-y-4\">\n                {project.tasks && project.tasks.length > 0 ?";
if (content.includes(tasksBlockStart)) {
  const startIdx = content.indexOf(tasksBlockStart);
  // find the closing of this block. It's before the next {activeTab === 'tasks'
  const nextTasksTab = content.indexOf("{activeTab === 'tasks' && (", startIdx + 10);
  if (nextTasksTab !== -1) {
    // we need to remove from startIdx up to nextTasksTab
    content = content.substring(0, startIdx) + content.substring(nextTasksTab);
    console.log('Removed read-only tasks block');
  }
}

// Check for duplicate tab buttons
const tasksBtnRegex = /<button[\s\S]*?onClick=\{\(\) => setActiveTab\('tasks'\)\}[\s\S]*?<\/button>/g;
const matches = content.match(tasksBtnRegex);
if (matches && matches.length > 1) {
  // Replace the first one with empty string
  content = content.replace(matches[0], '');
  console.log('Removed duplicate tasks tab button');
}

fs.writeFileSync(file, content, 'utf8');
console.log('Cleaned up ProjectDetailsModal.tsx');
