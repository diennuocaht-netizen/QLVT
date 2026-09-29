const fs = require('fs');
const file = 'src/pages/HREvents.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add expandedEvents state
if (!content.includes('expandedEvents')) {
  content = content.replace(
    "const [editingEvent, setEditingEvent] = useState<any | null>(null);",
    "const [editingEvent, setEditingEvent] = useState<any | null>(null);\n    const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());\n\n    const toggleExpand = (e: React.MouseEvent, eventId: string) => {\n      e.stopPropagation();\n      setExpandedEvents(prev => {\n        const next = new Set(prev);\n        if (next.has(eventId)) next.delete(eventId);\n        else next.add(eventId);\n        return next;\n      });\n    };"
  );
}

// 2. Add ChevronDown icon to imports if missing
if (!content.includes('ChevronDown')) {
  content = content.replace("Search, Filter", "Search, Filter, ChevronDown, ChevronUp");
}

// 3. Update the rendering of the tasks list in the card
const oldTasksRender = `{event.hr_event_tasks?.slice(0, 3).map((t: any) => (`;
const newTasksRender = `{(expandedEvents.has(event.id) ? event.hr_event_tasks : event.hr_event_tasks?.slice(0, 3)).map((t: any) => (`;

if (content.includes(oldTasksRender)) {
  content = content.replace(oldTasksRender, newTasksRender);
}

const oldMoreTasks = `{(event.hr_event_tasks?.length || 0) > 3 && (
                        <p className="text-xs text-gray-400 italic">...và {(event.hr_event_tasks?.length || 0) - 3} hạng mục khác</p>
                      )}`;

const newMoreTasks = `{(event.hr_event_tasks?.length || 0) > 3 && (
                        <button 
                          onClick={(e) => toggleExpand(e, event.id)}
                          className="flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-800 mt-1"
                        >
                          {expandedEvents.has(event.id) ? (
                            <><ChevronUp className="w-3 h-3 mr-1" /> Thu gọn</>
                          ) : (
                            <><ChevronDown className="w-3 h-3 mr-1" /> Xem tất cả {(event.hr_event_tasks?.length || 0)} hạng mục</>
                          )}
                        </button>
                      )}`;

if (content.includes(oldMoreTasks)) {
  content = content.replace(oldMoreTasks, newMoreTasks);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Patched HREvents to support expand/collapse tasks.');
