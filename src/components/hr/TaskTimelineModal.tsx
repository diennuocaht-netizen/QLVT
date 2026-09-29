import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase-client';
import { X, Clock, User, CheckCircle, ArrowRight } from 'lucide-react';

export const TaskTimelineModal: React.FC<{ groupId: string, onClose: () => void }> = ({ groupId, onClose }) => {
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimeline();
  }, [groupId]);

  const fetchTimeline = async () => {
    const { data } = await supabase
      .from('hr_shift_tasks')
      .select('*, assignee:users!hr_shift_tasks_assignee_id_fkey(display_name), shift:shift_types(name)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true });
    
    if (data) setTimeline(data);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">Truy vết quá trình xử lý</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex justify-center"><div className="animate-spin h-6 w-6 border-b-2 border-indigo-600 rounded-full"></div></div>
          ) : (
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
              {timeline.map((t, index) => (
                <div key={t.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm \${t.status === 'done' ? 'bg-green-500 text-white' : t.status === 'handover' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'}`}>
                    {t.status === 'done' ? <CheckCircle size={16} /> : t.status === 'handover' ? <ArrowRight size={16} /> : <Clock size={16} />}
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-gray-900">{t.shift?.name || 'Không rõ ca'}</span>
                      <time className="text-xs font-medium text-gray-500">{new Date(t.date).toLocaleDateString('vi-VN')}</time>
                    </div>
                    <p className="text-xs text-gray-700 font-medium mb-2">{t.assignee?.display_name || 'Chưa phân công'}</p>
                    <div className="text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 p-2 rounded">
                      {t.description || t.title}
                    </div>
                    {t.handover_note && (
                      <div className="mt-2 text-xs text-orange-800 bg-orange-50 p-2 rounded border border-orange-100 font-medium">
                        <span className="font-bold">Bàn giao:</span> {t.handover_note}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
