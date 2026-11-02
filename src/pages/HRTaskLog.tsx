import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase-client';
import * as XLSX from 'xlsx';
import { 
  Calendar as CalendarIcon, 
  Search, 
  History, 
  FileText, 
  User, 
  Layers, 
  CheckCircle, 
  Download, 
  Filter, 
  Clock, 
  ArrowRight, 
  Users, 
  RotateCcw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { getVietnamDateString } from '../utils/dateUtils';
import { TaskTimelineModal } from '../components/hr/TaskTimelineModal';
import { usePermission } from '../hooks/usePermission';
import { AccessDenied } from '../components/AccessDenied';

export const HRTaskLog: React.FC = () => {
  const { can } = usePermission();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubsystem, setSelectedSubsystem] = useState('all');
  const [selectedTimelineGroupId, setSelectedTimelineGroupId] = useState<string | null>(null);
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());
  const [expandedProcessIds, setExpandedProcessIds] = useState<Set<string>>(new Set());
  
  // Default to this month
  const today = new Date();
  const firstDay = getVietnamDateString(new Date(today.getFullYear(), today.getMonth(), 1));
  const lastDay = getVietnamDateString(new Date(today.getFullYear(), today.getMonth() + 1, 0));
  
  const [startDate, setStartDate] = useState(firstDay);
  const [endDate, setEndDate] = useState(lastDay);

  useEffect(() => {
    fetchLogs();
  }, [startDate, endDate]);

  const toggleExpand = (id: string) => {
    setExpandedLogIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleProcessExpand = (id: string) => {
    setExpandedProcessIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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
          subsystem:inventory_subsystems(name),
          shift:shift_types(id, name, code)
        `)
        .eq('status', 'done')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('completed_at', { ascending: false });

      if (doneErr) throw doneErr;

      // 2. Fetch users for completers resolution
      const { data: users } = await supabase.from('users').select('id, display_name');
      const usersMap = new Map((users || []).map(u => [u.id, u.display_name]));

      // 3. For tasks that might have been handed over, fetch their entire chain
      // A group_id or task id links all handovers of the same task.
      const validGroupIds = Array.from(new Set(
        (doneTasks || [])
          .map(t => t.group_id || t.id)
          .filter(Boolean)
      ));
      
      let allGroupTasks: any[] = [];
      if (validGroupIds.length > 0) {
        const { data: groupTasks, error: groupErr } = await supabase
          .from('hr_shift_tasks')
          .select(`
            id,
            group_id,
            title,
            description,
            date,
            shift_id,
            assignee_id,
            priority,
            status,
            handover_note,
            completion_note,
            completers,
            created_at,
            updated_at,
            completed_at,
            creator:users!hr_shift_tasks_created_by_fkey(id, display_name),
            assignee:users!hr_shift_tasks_assignee_id_fkey(id, display_name),
            shift:shift_types(id, name, code)
          `)
          .or(`group_id.in.(${validGroupIds.join(',')}),id.in.(${validGroupIds.join(',')})`)
          .order('created_at', { ascending: true });
          
        if (!groupErr && groupTasks) {
          allGroupTasks = groupTasks;
        }
      }

      // Assemble the final log entries with multi-shift tracking
      const assembledLogs = (doneTasks || []).map(doneTask => {
        const targetGroupId = doneTask.group_id || doneTask.id;
        
        let history = allGroupTasks.filter(t => 
          t.id === targetGroupId || 
          t.group_id === targetGroupId ||
          (doneTask.group_id && (t.group_id === doneTask.group_id || t.id === doneTask.group_id))
        );

        const uniqueHistoryMap = new Map();
        history.forEach(t => uniqueHistoryMap.set(t.id, t));
        uniqueHistoryMap.set(doneTask.id, doneTask);
        history = Array.from(uniqueHistoryMap.values());

        history.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        const originTask = history[0];
        const isMultiShift = history.length > 1;

        // Clean original description (strip appended handover stamp if any)
        const rawDesc = originTask.description || '';
        const cleanOriginalDescription = rawDesc.includes('\n\n[BÀN GIAO TỪ')
          ? rawDesc.split('\n\n[BÀN GIAO TỪ')[0].trim()
          : rawDesc.trim();

        // Map each shift step
        const shiftSteps = history.map((stepTask, idx) => {
          const shiftName = stepTask.shift?.name || `Ca ${idx + 1}`;
          const shiftDate = stepTask.date ? new Date(stepTask.date).toLocaleDateString('vi-VN') : '';
          const shiftLabel = `${shiftName}${shiftDate ? ` (${shiftDate})` : ''}`;

          let stepWorkers: string[] = (stepTask.completers || [])
            .map((id: string) => usersMap.get(id))
            .filter(Boolean);

          if (stepWorkers.length === 0 && stepTask.assignee?.display_name) {
            stepWorkers = [stepTask.assignee.display_name];
          }

          const isFinal = stepTask.id === doneTask.id || stepTask.status === 'done' || idx === history.length - 1;
          const note = isFinal
            ? (stepTask.completion_note || doneTask.completion_note || 'Đã hoàn thành')
            : (stepTask.handover_note || 'Chuyển ca sau');

          return {
            stepIndex: idx + 1,
            shiftId: stepTask.shift_id,
            shiftName,
            shiftDate,
            shiftLabel,
            workers: stepWorkers,
            assigneeName: stepTask.assignee?.display_name || '',
            note,
            isFinal,
            status: stepTask.status,
            date: stepTask.date,
            createdAt: stepTask.created_at,
            completedAt: stepTask.completed_at
          };
        });

        // Collect all distinct completers across all shifts
        const allWorkersSet = new Set<string>();
        shiftSteps.forEach(s => {
          s.workers.forEach(w => allWorkersSet.add(w));
        });
        const allCompleters = Array.from(allWorkersSet);

        if (allCompleters.length === 0 && doneTask.assignee?.display_name) {
          allCompleters.push(doneTask.assignee.display_name);
        }

        // Summary string of workers per shift
        const completersByShiftStr = shiftSteps
          .map(s => `${s.shiftLabel}: ${s.workers.join(', ') || 'Chưa rõ'}`)
          .join(' ➔ ');

        // Full process text for Excel & display
        const fullProcessText = isMultiShift
          ? shiftSteps.map(s => {
              const roleText = s.isFinal ? '[KẾT QUẢ HOÀN THÀNH]' : '[BÀN GIAO]';
              const workers = s.workers.join(', ') || s.assigneeName || 'Chưa rõ';
              return `${s.stepIndex}. ${s.shiftLabel} - Người thực hiện: ${workers}\n   ${roleText}: ${s.note}`;
            }).join('\n\n')
          : (doneTask.completion_note || 'Đã hoàn thành');

        return {
          id: doneTask.id,
          group_id: doneTask.group_id,
          title: doneTask.title,
          subsystem_name: doneTask.subsystem?.name || 'Chưa phân loại',
          is_multi_shift: isMultiShift,
          shift_count: history.length,
          shift_steps: shiftSteps,
          
          // Origin details
          assigned_at: originTask.created_at,
          assigner: originTask.creator?.display_name || 'Hệ thống',
          original_description: cleanOriginalDescription,
          
          // Personnel
          assignee: doneTask.assignee?.display_name || 'Chưa phân công',
          all_completers: allCompleters,
          final_completers: (doneTask.completers || []).map((id: string) => usersMap.get(id) || 'Unknown'),
          completers_by_shift_str: completersByShiftStr,
          
          // Completion & Process
          completed_at: doneTask.completed_at || doneTask.updated_at,
          completion_note: doneTask.completion_note || doneTask.description,
          full_process_text: fullProcessText
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
    const search = searchTerm.toLowerCase();
    const matchSearch = 
      log.title.toLowerCase().includes(search) || 
      log.subsystem_name.toLowerCase().includes(search) ||
      log.all_completers.join(', ').toLowerCase().includes(search) ||
      (log.original_description && log.original_description.toLowerCase().includes(search)) ||
      (log.full_process_text && log.full_process_text.toLowerCase().includes(search));
      
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
      'Số ca xử lý': log.is_multi_shift ? `${log.shift_count} ca` : '1 ca',
      'Người giao việc': log.assigner,
      'Thời gian giao': new Date(log.assigned_at).toLocaleString('vi-VN'),
      'Nội dung yêu cầu ban đầu': log.original_description || '-',
      'Tất cả người tham gia': log.all_completers.join(', '),
      'Người thực hiện theo từng ca': log.completers_by_shift_str,
      'Thời gian hoàn thành': new Date(log.completed_at).toLocaleString('vi-VN'),
      'Chi tiết quá trình xử lý & Kết quả': log.full_process_text
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    
    const wscols = [
      {wch: 5},  // STT
      {wch: 32}, // Công việc
      {wch: 18}, // Phân hệ
      {wch: 12}, // Số ca xử lý
      {wch: 20}, // Người giao
      {wch: 18}, // Thời gian giao
      {wch: 40}, // Nội dung yêu cầu ban đầu
      {wch: 32}, // Tất cả người tham gia
      {wch: 45}, // Người thực hiện theo từng ca
      {wch: 18}, // Thời gian hoàn thành
      {wch: 60}  // Chi tiết quá trình xử lý & Kết quả
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "NhatKyCongViec");
    XLSX.writeFile(wb, `NhatKyCongViec_${startDate}_to_${endDate}.xlsx`);
  };

  if (!can('hr_task_log', 'view')) {
    return <AccessDenied title="Nhật ký công việc" />;
  }

  return (
    <div className="space-y-6 h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nhật ký công việc</h1>
          <p className="text-gray-500 text-sm mt-1">Lưu trữ lịch sử, người tham gia và tiến trình chi tiết các công việc đã hoàn thành qua các ca.</p>
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
          <div className="flex-1 min-w-[220px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Tìm theo việc, người tham gia, nội dung..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-1.5 md:py-2 text-sm w-full border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
        {can('hr_task_log', 'export') && (
          <button
            onClick={handleExportExcel}
            className="flex items-center px-4 py-1.5 md:py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm font-medium"
          >
            <Download className="w-4 h-4 mr-2" />
            Xuất Excel
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Công việc & Phân hệ</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Giao việc<br/><span className="text-[11px] font-normal text-gray-400">(Người / Thời gian)</span></th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Nội dung yêu cầu</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phụ trách<br/><span className="text-[11px] font-normal text-gray-400">(Assignee)</span></th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Người tham gia & Hoàn thành</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider min-w-[280px]">Quá trình xử lý & Kết quả</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                    <p className="mt-2 text-sm">Đang tải nhật ký công việc...</p>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <History className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-sm">Không tìm thấy nhật ký công việc nào trong khoảng thời gian đã chọn.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedLogIds.has(log.id);
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Column 1: Công việc & Phân hệ */}
                      <td className="px-4 py-4 align-top">
                        <div className="font-bold text-sm text-gray-900 leading-snug">{log.title}</div>
                        <div className="mt-1 flex items-center text-xs text-teal-700 bg-teal-50 border border-teal-100 rounded px-1.5 py-0.5 w-max font-medium">
                          <Layers className="w-3 h-3 mr-1" />
                          {log.subsystem_name}
                        </div>
                        {log.is_multi_shift ? (
                          <div className="mt-2 space-y-1">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                              <RotateCcw className="w-3 h-3 mr-1" />
                              Xử lý qua {log.shift_count} ca
                            </span>
                            <div>
                              <button 
                                onClick={() => setSelectedTimelineGroupId(log.group_id || log.id)}
                                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center hover:underline"
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                Xem dòng thời gian
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </td>

                      {/* Column 2: Giao việc */}
                      <td className="px-4 py-4 align-top text-sm">
                        <div className="text-gray-900 font-medium whitespace-nowrap flex items-center">
                          <User className="w-3.5 h-3.5 mr-1 text-gray-400 shrink-0"/>
                          {log.assigner}
                        </div>
                        <div className="text-gray-500 text-xs mt-1 whitespace-nowrap">
                          {new Date(log.assigned_at).toLocaleString('vi-VN')}
                        </div>
                      </td>

                      {/* Column 3: Nội dung yêu cầu ban đầu */}
                      <td className="px-4 py-4 align-top text-sm text-gray-600 max-w-xs">
                        <div className={`whitespace-pre-wrap ${isExpanded ? '' : 'line-clamp-3'}`}>
                          {log.original_description || '-'}
                        </div>
                        {log.original_description && log.original_description.length > 90 && (
                          <button
                            onClick={() => toggleExpand(log.id)}
                            className="text-[11px] text-indigo-600 font-medium hover:underline flex items-center mt-1"
                          >
                            {isExpanded ? <><ChevronUp size={12} className="mr-0.5"/> Ẩn bớt</> : <><ChevronDown size={12} className="mr-0.5"/> Xem thêm</>}
                          </button>
                        )}
                      </td>

                      {/* Column 4: Phụ trách */}
                      <td className="px-4 py-4 align-top text-sm">
                        <div className="text-gray-900 font-medium whitespace-nowrap flex items-center">
                          <User className="w-3.5 h-3.5 mr-1 text-blue-500 shrink-0"/>
                          {log.assignee}
                        </div>
                        {log.is_multi_shift && (
                          <span className="text-[10px] text-gray-400 font-medium block mt-0.5">(Ca hoàn thành)</span>
                        )}
                      </td>

                      {/* Column 5: Người tham gia & Hoàn thành */}
                      <td className="px-4 py-4 align-top text-sm">
                        <div className="mb-2">
                          <div className="text-[11px] font-semibold text-gray-700 mb-1 flex items-center">
                            <Users className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                            Tất cả người tham gia ({log.all_completers.length}):
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {log.all_completers.map((name: string, i: number) => (
                              <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded bg-green-50 text-green-700 text-[11px] font-medium border border-green-200 whitespace-nowrap">
                                <CheckCircle className="w-3 h-3 mr-1 text-green-600" />
                                {name}
                              </span>
                            ))}
                          </div>
                        </div>

                        {log.is_multi_shift && (
                          <div className="mt-2 pt-2 border-t border-gray-100 text-[11px] text-gray-500 space-y-1">
                            <span className="text-gray-400 font-medium block text-[10px] uppercase">Phân công theo ca:</span>
                            {log.shift_steps.map((step: any, idx: number) => (
                              <div key={idx} className="flex items-start gap-1 leading-snug">
                                <span className="font-semibold text-gray-700 whitespace-nowrap">{step.shiftName}:</span>
                                <span className="text-gray-600">{step.workers.join(', ') || 'Chưa rõ'}</span>
                                {step.isFinal && <span className="text-[10px] text-green-600 font-bold bg-green-50 px-1 rounded border border-green-100">(Đích)</span>}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="text-gray-400 text-xs mt-2 pt-1 border-t border-gray-100 whitespace-nowrap">
                          Hoàn tất: {new Date(log.completed_at).toLocaleString('vi-VN')}
                        </div>
                      </td>

                      {/* Column 6: Quá trình xử lý & Kết quả */}
                      <td className="px-4 py-4 align-top text-sm text-gray-600 min-w-[280px]">
                        {!log.is_multi_shift ? (
                          <div className="whitespace-pre-wrap text-sm text-gray-800 bg-gray-50/70 p-2.5 rounded-lg border border-gray-200/80">
                            {log.completion_note || '-'}
                          </div>
                        ) : (() => {
                          const isProcessExpanded = expandedProcessIds.has(log.id);
                          const finalStep = log.shift_steps.find((s: any) => s.isFinal) || log.shift_steps[log.shift_steps.length - 1];

                          if (!isProcessExpanded) {
                            return (
                              <div className="space-y-1.5">
                                <div className="p-2.5 rounded-lg border border-green-200 bg-green-50/70 text-green-950 shadow-xs">
                                  <div className="flex items-center justify-between font-bold text-xs mb-1 pb-1 border-b border-green-200/60">
                                    <span className="flex items-center gap-1.5 text-green-800">
                                      <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                      <span>Kết quả hoàn thành ({finalStep?.shiftName || 'Ca cuối'}):</span>
                                    </span>
                                    {finalStep?.workers?.length > 0 && (
                                      <span className="text-[11px] font-normal text-gray-500">
                                        {finalStep.workers.join(', ')}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs whitespace-pre-wrap text-gray-800 font-medium pl-1">
                                    {finalStep?.note || log.completion_note || 'Đã hoàn thành'}
                                  </div>
                                </div>
                                <button
                                  onClick={() => toggleProcessExpand(log.id)}
                                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center hover:underline bg-indigo-50/80 px-2.5 py-1 rounded-md border border-indigo-100 transition-colors"
                                >
                                  <ChevronDown size={13} className="mr-1" />
                                  Xem chi tiết quá trình ({log.shift_count} ca)
                                </button>
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                  Chi tiết qua {log.shift_count} ca:
                                </span>
                                <button
                                  onClick={() => toggleProcessExpand(log.id)}
                                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center hover:underline bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded transition-colors"
                                >
                                  <ChevronUp size={13} className="mr-0.5" />
                                  Thu gọn
                                </button>
                              </div>
                              {log.shift_steps.map((step: any, idx: number) => (
                                <div 
                                  key={idx} 
                                  className={`p-2.5 rounded-lg border text-xs transition-all ${
                                    step.isFinal 
                                      ? 'bg-green-50/80 border-green-200 text-green-950 shadow-sm' 
                                      : 'bg-amber-50/70 border-amber-200 text-amber-950'
                                  }`}
                                >
                                  <div className="flex items-center justify-between font-bold mb-1 pb-1 border-b border-black/5">
                                    <span className="flex items-center gap-1.5">
                                      {step.isFinal ? (
                                        <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />
                                      ) : (
                                        <ArrowRight className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                      )}
                                      <span className="text-gray-900">{step.shiftLabel}</span>
                                    </span>
                                    <span className="text-[11px] font-medium text-gray-500">
                                      {step.workers.join(', ') || step.assigneeName || 'Nhân sự ca'}
                                    </span>
                                  </div>
                                  <div className="text-xs whitespace-pre-wrap pl-2 border-l-2 border-current/30 mt-1">
                                    <span className="font-semibold text-gray-800">
                                      {step.isFinal ? 'Kết quả hoàn thành:' : 'Nội dung bàn giao:'}
                                    </span>{' '}
                                    <span className="text-gray-700">{step.note}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTimelineGroupId && (
        <TaskTimelineModal
          groupId={selectedTimelineGroupId}
          onClose={() => setSelectedTimelineGroupId(null)}
        />
      )}
    </div>
  );
};
