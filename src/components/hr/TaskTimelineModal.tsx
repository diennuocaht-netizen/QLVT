import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase-client';
import { X, Clock, User, CheckCircle, ArrowRight, Check, Users, Layers, AlertCircle } from 'lucide-react';

export const TaskTimelineModal: React.FC<{ groupId: string, onClose: () => void }> = ({ groupId, onClose }) => {
  const [timeline, setTimeline] = useState<any[]>([]);
  const [usersMap, setUsersMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeline();
  }, [groupId]);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      // 1. Resolve actual target group: check if groupId belongs to a task with a group_id
      let targetGroupId = groupId;
      const { data: currentTask } = await supabase
        .from('hr_shift_tasks')
        .select('id, group_id')
        .eq('id', groupId)
        .maybeSingle();

      if (currentTask?.group_id) {
        targetGroupId = currentTask.group_id;
      }

      // 2. Fetch all tasks in the chain and users
      const [tasksRes, usersRes] = await Promise.all([
        supabase
          .from('hr_shift_tasks')
          .select(`
            *,
            assignee:users!hr_shift_tasks_assignee_id_fkey(id, display_name),
            creator:users!hr_shift_tasks_created_by_fkey(id, display_name),
            shift:shift_types(id, name, code),
            subsystem:inventory_subsystems(name)
          `)
          .or(`group_id.eq.${targetGroupId},id.eq.${targetGroupId}`)
          .order('created_at', { ascending: true }),
        supabase.from('users').select('id, display_name')
      ]);

      if (usersRes.data) {
        setUsersMap(new Map(usersRes.data.map(u => [u.id, u.display_name])));
      }

      if (tasksRes.data) {
        // De-duplicate by id
        const unique = Array.from(new Map(tasksRes.data.map(t => [t.id, t])).values());
        unique.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        setTimeline(unique);
      }
    } catch (err) {
      console.error('Error fetching timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  // Collect all unique workers across all shifts
  const allWorkersSet = new Set<string>();
  timeline.forEach(t => {
    const list = (t.completers || []).map((id: string) => usersMap.get(id)).filter(Boolean);
    if (list.length > 0) {
      list.forEach((name: string) => allWorkersSet.add(name));
    } else if (t.assignee?.display_name) {
      allWorkersSet.add(t.assignee.display_name);
    }
  });
  const allWorkers = Array.from(allWorkersSet);

  const primaryTask = timeline.length > 0 ? timeline[0] : null;
  const isDone = timeline.some(t => t.status === 'done');

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-3 md:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/80">
          <div>
            <h2 className="text-base md:text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              Truy vết quá trình xử lý qua các ca
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Lịch sử chuyển giao, nhân sự tham gia và kết quả theo từng ca làm việc.</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Task Summary Banner */}
        {primaryTask && (
          <div className="bg-gradient-to-r from-indigo-50/60 to-blue-50/40 px-5 py-3 border-b border-indigo-100/80 text-xs">
            <div className="font-bold text-sm text-gray-900 mb-1.5">{primaryTask.title}</div>
            
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {primaryTask.subsystem?.name && (
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-medium border border-teal-100">
                  <Layers className="w-3 h-3 mr-1" />
                  {primaryTask.subsystem.name}
                </span>
              )}
              <span className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-100/70 text-indigo-800 font-bold border border-indigo-200">
                🔄 Xử lý qua {timeline.length} ca
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded font-bold border ${
                isDone 
                  ? 'bg-green-100 text-green-800 border-green-200' 
                  : 'bg-amber-100 text-amber-800 border-amber-200'
              }`}>
                {isDone ? '✅ Đã hoàn thành' : '⏳ Đang bàn giao / Xử lý'}
              </span>
            </div>

            {allWorkers.length > 0 && (
              <div className="flex items-start flex-wrap gap-1.5 pt-1.5 border-t border-indigo-100/60">
                <span className="text-gray-500 font-semibold flex items-center whitespace-nowrap">
                  <Users className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                  Tất cả nhân sự tham gia ({allWorkers.length}):
                </span>
                {allWorkers.map((name, idx) => (
                  <span key={idx} className="bg-white text-gray-800 px-2 py-0.5 rounded font-medium border border-indigo-100 shadow-xs">
                    {name}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Timeline Body */}
        <div className="p-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-500">
              <div className="animate-spin h-7 w-7 border-3 border-indigo-600 border-t-transparent rounded-full"></div>
              <p className="mt-2 text-xs">Đang tải lịch sử các ca...</p>
            </div>
          ) : timeline.length === 0 ? (
            <div className="text-center py-10 text-gray-500 text-sm">
              <AlertCircle className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              Không tìm thấy dữ liệu tiến trình cho công việc này.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-indigo-100">
              {timeline.map((t, index) => {
                const shiftWorkers = (t.completers || [])
                  .map((id: string) => usersMap.get(id))
                  .filter(Boolean);

                const isCurrentShiftDone = t.status === 'done';
                const isHandover = t.status === 'handover';

                return (
                  <div key={t.id} className="relative">
                    {/* Circle icon on the left timeline line */}
                    <div className={`absolute -left-6 top-1.5 flex items-center justify-center w-6 h-6 rounded-full border-2 border-white shadow-sm ring-2 ${
                      isCurrentShiftDone 
                        ? 'bg-green-600 text-white ring-green-100' 
                        : isHandover 
                        ? 'bg-amber-500 text-white ring-amber-100' 
                        : 'bg-blue-500 text-white ring-blue-100'
                    }`}>
                      {isCurrentShiftDone ? (
                        <Check size={13} strokeWidth={3} />
                      ) : isHandover ? (
                        <ArrowRight size={13} strokeWidth={3} />
                      ) : (
                        <Clock size={13} strokeWidth={3} />
                      )}
                    </div>

                    {/* Step Card */}
                    <div className="bg-white rounded-lg border border-gray-200 shadow-xs hover:border-gray-300 transition-colors overflow-hidden">
                      {/* Step Card Header */}
                      <div className={`px-4 py-2.5 flex items-center justify-between border-b ${
                        isCurrentShiftDone 
                          ? 'bg-green-50/70 border-green-100' 
                          : 'bg-amber-50/50 border-amber-100'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-900">
                            Ca {index + 1}: {t.shift?.name || 'Không rõ ca'}
                          </span>
                          <span className="text-xs text-gray-500 font-medium">
                            • {new Date(t.date).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                          isCurrentShiftDone 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}>
                          {isCurrentShiftDone ? 'Đã hoàn thành' : 'Đã bàn giao ca sau'}
                        </span>
                      </div>

                      {/* Step Card Body */}
                      <div className="p-4 space-y-2.5 text-xs">
                        {/* Participants & Assignee */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pb-2.5 border-b border-gray-100">
                          <div>
                            <span className="text-gray-400">Người giao việc:</span>{' '}
                            <span className="font-semibold text-gray-800">{t.creator?.display_name || 'Hệ thống'}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Người phụ trách ca:</span>{' '}
                            <span className="font-semibold text-indigo-700">{t.assignee?.display_name || 'Chưa phân công'}</span>
                          </div>
                        </div>

                        {/* Workers in this shift */}
                        <div>
                          <div className="text-gray-400 font-medium mb-1 flex items-center">
                            <Users className="w-3.5 h-3.5 mr-1 text-gray-500" />
                            Nhân sự tham gia xử lý ca này:
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {shiftWorkers.length > 0 ? (
                              shiftWorkers.map((name: string, idx: number) => (
                                <span 
                                  key={idx} 
                                  className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />
                                  {name}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-500 italic">
                                {t.assignee?.display_name || 'Chưa ghi nhận'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Initial request description (only show on first shift) */}
                        {index === 0 && t.description && (
                          <div className="bg-gray-50 p-2.5 rounded-md border border-gray-200 text-gray-700">
                            <div className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Nội dung yêu cầu ban đầu:</div>
                            <div className="whitespace-pre-wrap">{t.description.split('\n\n[BÀN GIAO TỪ')[0]}</div>
                          </div>
                        )}

                        {/* Handover note */}
                        {t.handover_note && (
                          <div className="bg-amber-50/80 p-2.5 rounded-md border border-amber-200 text-amber-900">
                            <div className="font-bold flex items-center gap-1 text-[11px] text-amber-800 mb-0.5">
                              <ArrowRight size={13} className="text-amber-600" />
                              Nội dung bàn giao ca sau:
                            </div>
                            <div className="whitespace-pre-wrap pl-4 text-xs font-medium">{t.handover_note}</div>
                          </div>
                        )}

                        {/* Completion note */}
                        {t.completion_note && (
                          <div className="bg-green-50/80 p-2.5 rounded-md border border-green-200 text-green-900">
                            <div className="font-bold flex items-center gap-1 text-[11px] text-green-800 mb-0.5">
                              <CheckCircle size={13} className="text-green-600" />
                              Kết quả xử lý & Hoàn thành:
                            </div>
                            <div className="whitespace-pre-wrap pl-4 text-xs font-medium">{t.completion_note}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
