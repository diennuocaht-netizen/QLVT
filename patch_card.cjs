const fs = require('fs');
let content = fs.readFileSync('src/pages/HRTasks.tsx', 'utf8');

// Find the main task card div
// It looks like: <div key={task.id} className="group relative bg-white p-3 rounded-lg shadow-sm border border-gray-200 ... cursor-move" draggable ...
const oldDiv = /className="group relative bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-move"[\s\S]*?draggable/;
const newDiv = `className="group relative bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-move hover:border-indigo-300"
                            onClick={() => { setEditingTask(task); setIsTaskModalOpen(true); }}
                            draggable`;
                            
if (!content.includes('hover:border-indigo-300')) {
    content = content.replace(oldDiv, newDiv);
    fs.writeFileSync('src/pages/HRTasks.tsx', content, 'utf8');
    console.log('Task card is now clickable');
} else {
    console.log('Task card already clickable');
}
