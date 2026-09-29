const fs = require('fs');
const file = 'src/pages/HRTasks.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Imports
if (!content.includes('TaskTimelineModal')) {
  content = content.replace("import { HandoverModal } from '../components/hr/HandoverModal';", "import { HandoverModal } from '../components/hr/HandoverModal';\nimport { TaskTimelineModal } from '../components/hr/TaskTimelineModal';");
}
if (!content.includes('History')) {
  content = content.replace("ChevronUp } from 'lucide-react';", "ChevronUp, History } from 'lucide-react';");
}

// 2. States
const newStates = `
  const [groupStatuses, setGroupStatuses] = useState<Record<string, any>>({});
  const [timelineGroupId, setTimelineGroupId] = useState<string | null>(null);
`;
content = content.replace("const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());", "const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());\n" + newStates);

// 3. Update fetchTasks to include groupStatuses logic
const fetchTasksEnd = `        setTasks(data);
      } else {
        setTasks([]);
      }`;
const fetchTasksNewEnd = `        setTasks(data);
        
        // Fetch group statuses for handover tasks
        const handoverGroupIds = data.filter(t => t.status === 'handover' && t.group_id).map(t => t.group_id);
        if (handoverGroupIds.length > 0) {
           const { data: latestInGroup } = await supabase
             .from('hr_shift_tasks')
             .select('group_id, status, shift:shift_types(name)')
             .in('group_id', handoverGroupIds)
             .order('created_at', { ascending: false });
             
           const gs: Record<string, any> = {};
           latestInGroup?.forEach(t => {
              if (!gs[t.group_id]) {
                 gs[t.group_id] = t;
              }
           });
           setGroupStatuses(gs);
        } else {
           setGroupStatuses({});
        }
      } else {
        setTasks([]);
      }`;
content = content.replace(fetchTasksEnd, fetchTasksNewEnd);

// 4. Update UI to add Badge and History Button
const oldDesc = `{task.description && (
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
                          )}
                          
                          {task.group_id && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); setTimelineGroupId(task.group_id); }}
                              className="text-[10px] text-blue-600 font-bold flex items-center bg-blue-50 px-2 py-1 rounded border border-blue-100 hover:bg-blue-100 transition-colors w-full justify-center mb-3"
                            >
                              <History size={12} className="mr-1" />
                              Truy vết luồng xử lý
                            </button>
                          )}

                          {task.status === 'handover' && groupStatuses[task.group_id] && groupStatuses[task.group_id].status === 'done' && (
                            <div className="mt-2 mb-3 text-[10px] font-bold text-green-700 bg-green-50 px-2 py-1.5 rounded border border-green-200 flex items-center shadow-sm">
                              <CheckCircle size={12} className="mr-1" />
                              Đã hoàn thành bởi {groupStatuses[task.group_id].shift?.name || 'ca sau'}
                            </div>
                          )}`;
content = content.replace(new RegExp(oldDesc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newDesc);

// 5. Add Modal rendering
const modalEnd = `      {timelineGroupId && (
        <TaskTimelineModal
          groupId={timelineGroupId}
          onClose={() => setTimelineGroupId(null)}
        />
      )}
    </div>
  );`;
content = content.replace("</div>\n  );", modalEnd);

fs.writeFileSync(file, content, 'utf8');
console.log('HRTasks patched with timeline tracking and dynamic badges.');
