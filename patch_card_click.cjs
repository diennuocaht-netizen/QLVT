const fs = require('fs');
let content = fs.readFileSync('src/pages/HRTasks.tsx', 'utf8');

const oldDiv = /className="bg-white border border-gray-200 rounded p-3 shadow-sm hover:shadow-md transition-shadow group relative cursor-grab active:cursor-grabbing"\s*draggable/g;
const newDiv = `className="bg-white border border-gray-200 rounded p-3 shadow-sm hover:shadow-md transition-shadow group relative cursor-grab active:cursor-grabbing hover:border-indigo-400"
                            onClick={() => { setEditingTask(task); setIsTaskModalOpen(true); }}
                            draggable`;

if (content.match(oldDiv)) {
    content = content.replace(oldDiv, newDiv);
    fs.writeFileSync('src/pages/HRTasks.tsx', content, 'utf8');
    console.log('Successfully patched task card to be clickable.');
} else {
    console.log('Could not find the target string.');
}
