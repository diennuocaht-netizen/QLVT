const fs = require('fs');
const file = 'src/pages/HREvents.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<div className="mt-4 pt-3 border-t border-gray-100">[\s\S]*?<div className="space-y-2 mt-auto pt-3 border-t border-gray-100">/;

const newLogic = `{
                    (() => {
                      const tasks = event.hr_event_tasks || [];
                      const completedTasks = tasks.filter((t: any) => t.status === 'done').length;
                      const progress = tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);
                      return (
                        <div className="mt-4 pt-3 border-t border-gray-100">
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hạng mục ({completedTasks}/{tasks.length})</p>
                            <span className="text-xs font-bold text-indigo-600">{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                            <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: \`\${progress}%\` }}></div>
                          </div>
                          <div className="space-y-2 mb-4">
                            {(expandedEvents.has(event.id) ? tasks : tasks.slice(0, 3)).map((t: any) => {
                              let remainingText = '';
                              if (t.deadline && t.status !== 'done') {
                                  const ms = new Date(t.deadline).getTime() - new Date().getTime();
                                  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
                                  if (days < 0) remainingText = 'Quá hạn';
                                  else if (days === 0) remainingText = 'Hôm nay';
                                  else remainingText = \`Còn \${days} ngày\`;
                              }
                              return (
                                <div key={t.id} className="flex flex-col text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                                  <div className="flex items-center">
                                    <div className={\`w-2 h-2 rounded-full mr-2 shrink-0 \${t.status === 'done' ? 'bg-green-500' : t.status === 'in_progress' ? 'bg-blue-500' : 'bg-gray-300'}\`}></div>
                                    <span className={\`flex-1 truncate \${t.status === 'done' ? 'line-through text-gray-400' : 'text-gray-700 font-medium'}\`}>{t.title}</span>
                                    {t.assignee_id === profile?.id && t.status !== 'done' && (
                                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded ml-2 shrink-0">Của bạn</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 ml-4 mt-1 text-[11px] text-gray-500">
                                    {t.status === 'done' ? <span className="text-green-600 font-medium">Hoàn thành</span> : t.status === 'in_progress' ? <span className="text-blue-600 font-medium">Đang làm</span> : <span>Chưa làm</span>}
                                    {remainingText && <span className={\`\${remainingText === 'Quá hạn' ? 'text-red-500 font-bold' : remainingText === 'Hôm nay' ? 'text-orange-500 font-bold' : ''}\`}>{remainingText}</span>}
                                  </div>
                                </div>
                              );
                            })}
                            {tasks.length > 3 && (
                              <button 
                                onClick={(e) => toggleExpand(e, event.id)}
                                className="flex items-center text-xs font-medium text-indigo-600 hover:text-indigo-800 mt-2"
                              >
                                {expandedEvents.has(event.id) ? (
                                  <><ChevronUp className="w-3 h-3 mr-1" /> Thu gọn</>
                                ) : (
                                  <><ChevronDown className="w-3 h-3 mr-1" /> Xem tất cả {tasks.length} hạng mục</>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()
                  }
                  <div className="space-y-2 mt-auto pt-3 border-t border-gray-100">`;

content = content.replace(regex, newLogic);
fs.writeFileSync(file, content, 'utf8');
console.log('Patched HREvents logic for advanced task preview.');
