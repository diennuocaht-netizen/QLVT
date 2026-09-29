const fs = require('fs');

// 1. Fix EventDetailsModal users fetch
const modalFile = 'src/components/hr/EventDetailsModal.tsx';
let modalCode = fs.readFileSync(modalFile, 'utf8');
modalCode = modalCode.replace("select('id, full_name, email')", "select('id, display_name, email')");
modalCode = modalCode.replace("u.full_name || u.email", "u.display_name || u.email");
fs.writeFileSync(modalFile, modalCode, 'utf8');
console.log('Fixed fetchUsers in modal.');

// 2. Fetch tasks in HREvents
const eventsFile = 'src/pages/HREvents.tsx';
let eventsCode = fs.readFileSync(eventsFile, 'utf8');
eventsCode = eventsCode.replace(".select('*')", ".select('*, hr_event_tasks(*)')");

// Display tasks on the card
const cardOld = `<div className="space-y-2 mt-auto mb-4 pt-4 border-t border-gray-100">`;
const cardNew = `<div className="mt-4 pt-3 border-t border-gray-100">
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
eventsCode = eventsCode.replace(cardOld, cardNew);

// In EventDetailsModal, they also mentioned "người dùng tạo hạng mục hay người được giao việc cập nhật phải vào chỉnh sửa... tôi muốn người dùng chỉ cần bấm xem sự kiện và bấm vào cập nhật trong hạng mục để cập nhật chứ không phải vào chỉnh sửa".
// Let's make EventDetailsModal default to the 'tasks' tab if the user is NOT an admin/manager (so they go straight to their tasks)!
