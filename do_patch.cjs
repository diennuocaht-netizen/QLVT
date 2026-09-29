const fs = require('fs');
const file = 'src/pages/HREvents.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('hr_event_tasks(*)')) {
    content = content.replace(".select('*')", ".select('*, hr_event_tasks(*)')");
    
    // Instead of exact match, use regex
    const oldCardRegex = /<div className="space-y-2 mt-auto mb-4 pt-4 border-t border-gray-100">/g;
    const newCard = `<div className="mt-4 pt-3 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Hạng mục công việc ({event.hr_event_tasks?.length || 0})</p>
                    <div className="space-y-1.5 mb-4">
                      {event.hr_event_tasks?.slice(0, 3).map((t: any) => (
                        <div key={t.id} className="flex items-center text-sm">
                          <div className={\`w-2 h-2 rounded-full mr-2 \${t.status === 'done' ? 'bg-green-500' : t.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'}\`}></div>
                          <span className={\`flex-1 truncate \${t.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700'}\`}>{t.title}</span>
                          {t.assignee_id === profile?.id && t.status !== 'done' && (
                             <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded ml-2">Của bạn</span>
                          )}
                        </div>
                      ))}
                      {(event.hr_event_tasks?.length || 0) > 3 && (
                        <p className="text-xs text-gray-400 italic">...và {(event.hr_event_tasks?.length || 0) - 3} hạng mục khác</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 mt-auto pt-3 border-t border-gray-100">`;

    if (oldCardRegex.test(content)) {
        content = content.replace(oldCardRegex, newCard);
        fs.writeFileSync(file, content, 'utf8');
        console.log('Successfully patched HREvents.tsx');
    } else {
        console.log('Regex did not match.');
    }
} else {
    console.log('Already patched.');
}
