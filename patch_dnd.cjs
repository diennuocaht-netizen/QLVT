const fs = require('fs');
const file = 'src/pages/HRTasks.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add Chevron imports
if (!content.includes('ChevronDown')) {
  content = content.replace("CheckCircle, Edit3, Trash2, FileText } from 'lucide-react';", "CheckCircle, Edit3, Trash2, FileText, ChevronDown, ChevronUp } from 'lucide-react';");
}

// Add state for expanded tasks
const stateInjection = `  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());

  const toggleTaskExpand = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    setExpandedTaskIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      updateTaskStatus(taskId, columnId);
    }
  };
`;
content = content.replace("const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);", "const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);\n" + stateInjection);

// Update Column Render for Drag & Drop
const oldCol = `<div key={col.id} className={\`flex-1 min-w-[280px] max-w-[350px] flex flex-col rounded-lg border \${col.color}\`}>`;
const newCol = `<div 
                  key={col.id} 
                  className={\`flex-1 min-w-[280px] max-w-[350px] flex flex-col rounded-lg border \${col.color}\`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, col.id)}
                >`;
content = content.replace(new RegExp(oldCol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newCol);

// Update Task Render for Drag & Drop and Expand
const oldTaskRender = `<div key={task.id} className="bg-white border border-gray-200 rounded p-3 shadow-sm hover:shadow-md transition-shadow group relative">`;
const newTaskRender = `<div 
                          key={task.id} 
                          className="bg-white border border-gray-200 rounded p-3 shadow-sm hover:shadow-md transition-shadow group relative cursor-grab active:cursor-grabbing"
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                        >`;
content = content.replace(new RegExp(oldTaskRender.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newTaskRender);

// Replace Description with Expandable version
const oldDesc = `{task.description && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{task.description}</p>}`;
const newDesc = `{task.description && (
                            <div className="mb-3">
                              <p className={\`text-xs text-gray-500 whitespace-pre-wrap \${expandedTaskIds.has(task.id) ? '' : 'line-clamp-2'}\`}>
                                {task.description}
                              </p>
                              {task.description.length > 80 && (
                                <button 
                                  onClick={(e) => toggleTaskExpand(e, task.id)}
                                  className="text-[10px] text-indigo-600 font-medium hover:underline flex items-center mt-1"
                                >
                                  {expandedTaskIds.has(task.id) ? <><ChevronUp size={12} className="mr-0.5"/> Ẩn bớt</> : <><ChevronDown size={12} className="mr-0.5"/> Xem toàn bộ thông tin</>}
                                </button>
                              )}
                            </div>
                          )}`;
content = content.replace(new RegExp(oldDesc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newDesc);

fs.writeFileSync(file, content, 'utf8');
console.log('HRTasks patched with DND and Expand.');
