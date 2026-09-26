const fs = require('fs');
const file = 'src/components/projects/ProjectDetailsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const firstTasksIdx = content.indexOf("{activeTab === 'tasks' && (");
const secondTasksIdx = content.indexOf("{activeTab === 'tasks' && (", firstTasksIdx + 10);

if (firstTasksIdx !== -1 && secondTasksIdx !== -1) {
  content = content.substring(0, firstTasksIdx) + content.substring(secondTasksIdx);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Removed old tasks block successfully!');
} else {
  console.log('Could not find both blocks');
}
