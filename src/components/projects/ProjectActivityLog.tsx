import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabase-client';
import { Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ProjectActivityLogProps {
  projectId: string;
}

export const ProjectActivityLog: React.FC<ProjectActivityLogProps> = ({ projectId }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('activity_logs')
          .select('*')
          .eq('entity_type', 'project')
          .eq('entity_id', projectId)
          .order('created_at', { ascending: false });
          
        if (data) setLogs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (projectId) fetchLogs();
  }, [projectId]);

  if (loading) {
    return <div className="p-4 text-center text-gray-500">Đang tải nhật ký...</div>;
  }

  if (logs.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
        <Clock className="w-10 h-10 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">Chưa có nhật ký hoạt động nào cho dự án này.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Nhật ký thay đổi</h3>
          <div className="flow-root">
            <ul className="-mb-8">
              {logs.map((log, logIdx) => (
                <li key={log.id}>
                  <div className="relative pb-8">
                    {logIdx !== logs.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center ring-8 ring-white">
                          <User className="w-4 h-4 text-indigo-600" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            <span className="font-medium text-gray-900">{log.user_email || 'Hệ thống'}</span>{' '}
                            {log.action}
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time dateTime={log.created_at}>
                            {format(new Date(log.created_at), 'HH:mm - dd/MM/yyyy', { locale: vi })}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
