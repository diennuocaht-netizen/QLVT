const fs = require('fs');
const file = 'src/components/projects/ProjectDetailsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// Find the first {activeTab === 'tasks' && (
const regex = /\{activeTab === 'tasks' && \([\s\S]*?\{project\.tasks\.map\(\(task: any, index: number\) => \{[\s\S]*?\}\) \}\s*<\/div>\s*\)\s*:\s*\([\s\S]*?<\/div>\s*\)\}\s*<\/div>\s*\)/;

if (regex.test(content)) {
  content = content.replace(regex, '');
  fs.writeFileSync(file, content, 'utf8');
  console.log('Removed read-only tasks block via regex');
} else {
  console.log('Regex did not match');
}
