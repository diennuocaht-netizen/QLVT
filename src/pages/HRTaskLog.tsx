import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase-client';
import * as XLSX from 'xlsx';
import { Calendar as CalendarIcon, Search, History, FileText, User, Layers, CheckCircle, Download, Filter } from 'lucide-react';

export const HRTaskLog: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubsystem, setSelectedSubsystem] = useState('all');
  
  // Default to this month
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  useEffect(() => {
    fetchLogs();
  }, [startDate, endDate]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // 1. Fetch completed tasks in date range
      const { data: doneTasks, error: doneErr } = await supabase
        .from('hr_shift_tasks')
        .select(`
          *,
          assignee:users!hr_shift_tasks_assignee_id_fkey(id, display_name),
          creator:users!hr_shift_tasks_created_by_fkey(id, display_name),
          subsystem:inventory_subsystems(name)
        `)
        .eq('status', 'done')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('completed_at', { ascending: false });

      if (doneErr) throw doneErr;

      // 2. Fetch users for completers resolution
      const { data: users } = await supabase.from('users').select('id, display_name');
      const usersMap = new Map((users || []).map(u => [u.id, u.display_name]));

      // 3. For tasks that might have been handed over, fetch their origins
      // A group_id links all handovers of the same task.
      const groupIds = (doneTasks || []).map(t => t.group_id).filter(Boolean);
      
      let allGroupTasks: any[] = [];
      if (groupIds.length > 0) {
        const { data: groupTasks, error: groupErr } = await supabase
          .from('hr_shift_tasks')
          .select(`
            id, group_id, created_at, description,
            creator:users!hr_shift_tasks_created_by_fkey(id, display_name)
          `)
          .in('group_id', groupIds)
          .order('created_at', { ascending: true });
          
        if (!groupErr && groupTasks) {
          allGroupTasks = groupTasks;
        }
      }

      // Assemble the final log entries
      const assembledLogs = (doneTasks || []).map(doneTask => {
        const history = allGroupTasks.filter(t => t.group_id === doneTask.group_id);
        const originTask = history.length > 0 ? history[0] : doneTask;
        
        const completerNames = (doneTask.completers || []).map((id: string) => usersMap.get(id) || 'Unknown');
        if (completerNames.length === 0 && doneTask.assignee) {
          completerNames.push(doneTask.assignee.display_name); // Fallback to assignee if empty
        }

        return {
          id: doneTask.id,
          group_id: doneTask.group_id,
          title: doneTask.title,
          subsystem_name: doneTask.subsystem?.name || 'Chưa phân loại',
          
          // Origin details
          assigned_at: originTask.created_at,
          assigner: originTask.creator?.display_name || 'Hệ thống',
          original_description: originTask.description,
          
          // Final details
          completed_at: doneTask.completed_at || doneTask.updated_at,
          completers: completerNames,
          completion_note: doneTask.completion_note || doneTask.description,
          assignee: doneTask.assignee?.display_name || 'Chưa phân công'
        };
      });

      setLogs(assembledLogs);
    } catch (err: any) {
      console.error(err);
      alert('Lỗi khi tải nhật ký: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const uniqueSubsystems = Array.from(new Set(logs.map(l => l.subsystem_name)));

  const filteredLogs = logs.filter(log => {
    const matchSearch = log.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.subsystem_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.completers.join(', ')).toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchSubsystem = selectedSubsystem === 'all' || log.subsystem_name === selectedSubsystem;
    
    return matchSearch && matchSubsystem;
  });

  const handleExportExcel = () => {
    if (filteredLogs.length === 0) {
      alert('Không có dữ liệu để xuất!');
      return;
    }
    const exportData = filteredLogs.map((log, index) => ({
      'STT': index + 1,
      'Công việc': log.title,
      'Phân hệ': log.subsystem_name,
      'Người giao': log.assigner,
      'Ngày giao': new Date(log.assigned_at).toLocaleString('vi-VN'),
      'Nội dung yêu cầu': log.original_description,
      'Người phụ trách': log.assignee,
      'Người hoàn thành': log.completers.join(', '),
      'Ngày hoàn thành': new Date(log.completed_at).toLocaleString('vi-VN'),
      'Kết quả / Ghi chú': log.completion_note
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    
    const wscols = [
      {wch: 5}, {wch: 30}, {wch: 20}, {wch: 20}, {wch: 20}, {wch: 40}, {wch: 20}, {wch: 30}, {wch: 20}, {wch: 40}
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "NhatKyCongViec");
    XLSX.writeFile(wb, `NhatKyCongViec_${startDate}_to_${endDate}.xlsx`);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nhật ký công việc</h1>
          <p className="text-gray-500 text-sm mt-1">Lưu trữ lịch sử các công việc đã hoàn thành qua các ca.</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2 md:p-4 shrink-0 flex flex-wrap gap-2 md:gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-2 md:gap-4 items-center">
        <div>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="pl-10 pr-4 py-1.5 md:py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-medium text-gray-900 w-36 md:w-40"
            />
          </div>
        </div>
        <div>
          <div className="relative">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="pl-10 pr-4 py-1.5 md:py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-medium text-gray-900 w-36 md:w-40"
            />
          </div>
        </div>
        <div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={selectedSubsystem}
              onChange={(e) => setSelectedSubsystem(e.target.value)}
              className="pl-10 pr-8 py-1.5 md:py-2 text-sm border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 font-medium text-gray-900 w-40 md:w-48 appearance-none bg-white"
            >
              <option value="all">Tất cả phân hệ</option>
              {uniqueSubsystems.map((ss, i) => (
                <option key={i} value={ss as string}>{ss as string}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm theo tên việc, người làm..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-1.5 md:py-2 text-sm w-full border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
        </div>
        <button
          onClick={handleExportExcel}
          className="flex items-center px-4 py-1.5 md:py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm font-medium"
        >
          <Download className="w-4 h-4 mr-2" />
          Xuất Excel
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Công việc & Phân hệ</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giao việc<br/>(Người / Thời gian)</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nội dung yêu cầu</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phụ trách<br/>(Assignee)</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hoàn thành<br/>(Người / Thời gian)</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kết quả xử lý</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                    <p className="mt-2">Đang tải dữ liệu...</p>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <History className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p>Không tìm thấy nhật ký công việc nào.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 align-top">
                      <div className="font-bold text-sm text-gray-900">{log.title}</div>
                      <div className="mt-1 flex items-center text-xs text-teal-700 bg-teal-50 border border-teal-100 rounded px-1.5 py-0.5 w-max">
                        <Layers className="w-3 h-3 mr-1" />
                        {log.subsystem_name}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-sm">
                      <div className="text-gray-900 font-medium whitespace-nowrap"><User className="w-3 h-3 inline mr-1 text-gray-400"/>{log.assigner}</div>
                      <div className="text-gray-500 text-xs mt-1 whitespace-nowrap">{new Date(log.assigned_at).toLocaleString('vi-VN')}</div>
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-gray-600 max-w-xs" title={log.original_description}>
                      <div className="line-clamp-3 whitespace-pre-wrap">{log.original_description || '-'}</div>
                    </td>
                    <td className="px-4 py-4 align-top text-sm">
                      <div className="text-gray-900 font-medium whitespace-nowrap"><User className="w-3 h-3 inline mr-1 text-blue-400"/>{log.assignee}</div>
                    </td>
                    <td className="px-4 py-4 align-top text-sm">
                      <div className="flex flex-col gap-1 mb-1">
                        {log.completers.map((name: string, i: number) => (
                          <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded bg-green-50 text-green-700 text-[11px] font-medium border border-green-100 whitespace-nowrap w-max">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {name}
                          </span>
                        ))}
                      </div>
                      <div className="text-gray-500 text-xs whitespace-nowrap">{new Date(log.completed_at).toLocaleString('vi-VN')}</div>
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-gray-600 min-w-[200px] whitespace-pre-wrap">
                      {log.completion_note || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
