import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase-client';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FileText, Server, Users, Clock, Plus, Edit, Trash, Activity, Calendar, ClipboardCheck, ArrowRight, User } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState({ documents: 0, devices: 0, users: 0, tasks: 0, events: 0 });
  const [activities, setActivities] = useState<any[]>([]);
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [ongoingEvents, setOngoingEvents] = useState<any[]>([]);
  const [todayStaff, setTodayStaff] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchActivities();
    fetchTodayData();
  }, [profile]);

  const fetchStats = async () => {
    try {
      const [docRes, devRes, userRes, taskRes, eventRes] = await Promise.all([
        supabase.from('iso_documents').select('id', { count: 'exact', head: true }),
        supabase.from('devices').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('hr_shift_tasks').select('id', { count: 'exact', head: true }).eq('date', new Date().toISOString().split('T')[0]),
        supabase.from('hr_events').select('id', { count: 'exact', head: true }).eq('status', 'in_progress')
      ]);

      setStats({
        documents: docRes.count || 0,
        devices: devRes.count || 0,
        users: userRes.count || 0,
        tasks: taskRes.count || 0,
        events: eventRes.count || 0
      });
    } catch (e) {}
  };

  const fetchActivities = async () => {
    const { data } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(8);
    if (data) setActivities(data);
  };

  const fetchTodayData = async () => {
    const today = new Date().toISOString().split('T')[0];

    // Fetch Today's Tasks
    const { data: tasks } = await supabase
      .from('hr_shift_tasks')
      .select('id, title, status, shift:shift_types(code), assignee:users!hr_shift_tasks_assignee_id_fkey(id, display_name)')
      .eq('date', today)
      .order('created_at', { ascending: false });

    if (tasks) {
      // Group tasks by status but also deduplicate by group_id (if needed, but simple is fine for dashboard)
      setTodayTasks(tasks.slice(0, 5)); // Just show top 5

      // Get task counts by user display_name
      const taskCountsMap = new Map();
      tasks.forEach(t => {
        if (t.assignee && t.assignee.display_name) {
          const nameStr = t.assignee.display_name.trim().toLowerCase();
          taskCountsMap.set(nameStr, (taskCountsMap.get(nameStr) || 0) + 1);
        }
      });

      // Fetch actual Shift Assignments for today
      const { data: assignments } = await supabase
        .from('shift_assignments')
        .select('*, employee:shift_employees(full_name, role), shift:shift_types(code, name)')
        .eq('date', today);

      if (assignments && assignments.length > 0) {
        const mainGroups: Record<string, any> = {
            'M': { code: 'M', name: 'Ca Sáng (06:00 - 14:00)', employees: [] },
            'A': { code: 'A', name: 'Ca Chiều (14:00 - 22:00)', employees: [] },
            'N': { code: 'N', name: 'Ca Đêm (22:00 - 06:00)', employees: [] },
            'OTHER': { code: 'Khác', name: 'Hành chính / Nghỉ / Công tác', employees: [] }
          };

          assignments.forEach(a => {
             if (!a.shift || !a.employee) return;
             const code = a.shift.code ? a.shift.code.trim().toUpperCase() : 'OTHER';
             const empNameLower = a.employee.full_name.trim().toLowerCase();
             
             const empObj = {
                name: a.employee.full_name,
                role: a.employee.role,
                tasksCount: taskCountsMap.get(empNameLower) || 0,
                originalShift: code
             };

             if (code === 'M') {
               mainGroups['M'].employees.push(empObj);
             } else if (code === 'A') {
               mainGroups['A'].employees.push(empObj);
             } else if (code === 'N') {
               mainGroups['N'].employees.push(empObj);
             } else if (code === 'M1') {
               mainGroups['M'].employees.push(empObj);
               mainGroups['A'].employees.push(empObj);
             } else if (code === 'N1') {
               mainGroups['A'].employees.push(empObj);
               mainGroups['N'].employees.push(empObj);
             } else if (code === 'AD') {
               mainGroups['M'].employees.push(empObj);
               mainGroups['A'].employees.push(empObj);
             } else {
               mainGroups['OTHER'].employees.push(empObj);
             }
          });

          const hour = new Date().getHours();
          let currentShiftCode = 'M';
          if (hour >= 6 && hour < 14) currentShiftCode = 'M';
          else if (hour >= 14 && hour < 22) currentShiftCode = 'A';
          else currentShiftCode = 'N';

          const groupOrder = ['M', 'A', 'N'];
          const startIndex = groupOrder.indexOf(currentShiftCode);
          const orderedMainGroups = [
            ...groupOrder.slice(startIndex),
            ...groupOrder.slice(0, startIndex)
          ];

          const finalGroups: any[] = [];
          orderedMainGroups.forEach(code => {
            if (mainGroups[code].employees.length > 0) {
               finalGroups.push(mainGroups[code]);
            }
          });
          if (mainGroups['OTHER'].employees.length > 0) {
            finalGroups.push(mainGroups['OTHER']);
          }

          finalGroups.forEach(sg => {
             sg.employees.sort((x: any, y: any) => {
                const roleX = (x.role || '').toLowerCase();
                const roleY = (y.role || '').toLowerCase();
                const xIsManager = roleX.includes('quản lý') || roleX.includes('ca trưởng') || roleX.includes('đội trưởng') || roleX.includes('đội phó');
                const yIsManager = roleY.includes('quản lý') || roleY.includes('ca trưởng') || roleY.includes('đội trưởng') || roleY.includes('đội phó');
                if (xIsManager && !yIsManager) return -1;
                if (!xIsManager && yIsManager) return 1;
                return y.tasksCount - x.tasksCount;
             });
          });
          
          setTodayStaff(finalGroups);
        } else {
          setTodayStaff([]);
        }
    }

    // Fetch Ongoing Events
    const { data: events } = await supabase
      .from('hr_events')
      .select('id, title, progress, status, end_date')
      .eq('status', 'in_progress')
      .order('end_date', { ascending: true })
      .limit(3);

    if (events) setOngoingEvents(events);
  };

  const renderStatusBadge = (status: string) => {
    switch(status) {
      case 'todo': return <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-bold">Chưa làm</span>;
      case 'in_progress': return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold">Đang làm</span>;
      case 'done': return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">Hoàn thành</span>;
      case 'handover': return <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-bold">Bàn giao</span>;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tổng quan Hệ thống</h1>
          <p className="text-gray-500 mt-1">Xin chào {profile?.displayName || profile?.email}, chúc bạn một ngày làm việc hiệu quả!</p>
        </div>
      </div>

      {/* OVERVIEW CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Tài liệu ISO</p>
            <p className="text-2xl font-bold text-gray-900">{stats.documents}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><FileText size={20}/></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Thiết bị</p>
            <p className="text-2xl font-bold text-gray-900">{stats.devices}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center"><Server size={20}/></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Việc hôm nay</p>
            <p className="text-2xl font-bold text-gray-900">{stats.tasks}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center"><ClipboardCheck size={20}/></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Sự kiện</p>
            <p className="text-2xl font-bold text-gray-900">{stats.events}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center"><Calendar size={20}/></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500 mb-1">Nhân sự</p>
            <p className="text-2xl font-bold text-gray-900">{stats.users}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center"><Users size={20}/></div>
        </div>
      </div>

              
      
      
      {/* MAIN 2-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today Tasks */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
              <h2 className="text-base font-bold text-gray-800 flex items-center">
                <ClipboardCheck className="w-4 h-4 mr-2 text-indigo-600" />
                Công việc ngày hôm nay
              </h2>
            </div>
            <div className="p-0">
              {todayTasks.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">Chưa có công việc nào trong ngày.</div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {todayTasks.map(task => (
                    <li key={task.id} className="p-4 hover:bg-gray-50/50 transition-colors flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-900 text-sm mb-1">{task.title}</span>
                        <div className="flex items-center text-xs text-gray-500">
                          {task.shift && <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded mr-2 font-medium">{task.shift.code}</span>}
                          <User size={12} className="mr-1"/> {task.assignee?.display_name || 'Chưa phân công'}
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        {renderStatusBadge(task.status)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          {/* CHART SECTION */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Thống kê công việc theo phân hệ (Tháng này)</h2>
          <div className="h-72 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="total"
                  >
                    {chartData.map((entry, index) => {
                      const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8B5CF6', '#F43F5E', '#10B981', '#F59E0B'];
                      return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                    })}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => {
                      return [`${value} việc (Xong: ${props.payload.done}, Đang làm/Chưa làm: ${props.payload.in_progress})`, props.payload.name];
                    }}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                  />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '11px', paddingTop: '10px'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Không có dữ liệu công việc trong tháng này.
              </div>
            )}
          </div>
        </div>
          {/* Ongoing Events */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50">
              <h2 className="text-base font-bold text-gray-800 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                Sự kiện đang & sắp diễn ra (5 ngày tới)
              </h2>
            </div>
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {ongoingEvents.length === 0 ? (
                <div className="col-span-full py-6 text-center text-sm text-gray-500">Không có sự kiện nào đang diễn ra.</div>
              ) : (
                ongoingEvents.map(event => (
                  <div key={event.id} className="border border-gray-100 rounded-lg p-4 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                    <h3 className="font-bold text-gray-900 text-sm mb-2">{event.title}</h3>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Tiến độ tổng</span>
                      <span className="font-bold text-blue-600">{event.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                      <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${event.progress}%` }}></div>
                    </div>
                    <div className="text-xs text-red-600 font-medium">Hạn chót: {new Date(event.end_date).toLocaleDateString('vi-VN')}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-1 space-y-6">
          {/* Active Staff Today */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50">
              <h2 className="text-base font-bold text-gray-800 flex items-center">
                <Users className="w-4 h-4 mr-2 text-emerald-600" />
                Nhân sự hôm nay
              </h2>
            </div>
            <div className="p-4">
              {todayStaff.length === 0 ? (
                <div className="py-4 text-center text-sm text-gray-500">Chưa có lịch phân ca hôm nay.</div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                  {todayStaff.map((shiftGroup, idx) => (
                    <div key={idx} className="bg-emerald-50/30 border border-emerald-100 rounded-lg overflow-hidden">
                      <div className="bg-emerald-100/50 px-3 py-2 text-xs font-bold text-emerald-800 flex justify-between border-b border-emerald-100">
                        <span>{shiftGroup.code} - {shiftGroup.name}</span>
                        <span>{shiftGroup.employees.length} nhân sự</span>
                      </div>
                      <div className="p-2 space-y-1.5">
                        {shiftGroup.employees.map((staff, sIdx) => {
                          const isManager = staff.role?.toLowerCase().includes('quản lý') || staff.role?.toLowerCase().includes('ca trưởng') || staff.role?.toLowerCase().includes('đội trưởng');
                          return (
                            <div key={sIdx} className="flex items-center justify-between p-2 rounded bg-white border border-emerald-50 shadow-sm">
                              <div className="flex items-center">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mr-2 ${isManager ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300' : 'bg-emerald-100 text-emerald-700'}`}>
                                  {staff.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                  <div className="flex items-center"><span className="text-sm font-semibold text-gray-900 leading-tight">{staff.name}</span>
                                    {staff.originalShift !== shiftGroup.code && staff.originalShift !== 'OTHER' && staff.originalShift !== 'M' && staff.originalShift !== 'A' && staff.originalShift !== 'N' && staff.originalShift !== '' && (
                                      <span className="text-[9px] bg-gray-200 text-gray-700 font-bold px-1.5 py-0.5 rounded ml-2 shadow-sm border border-gray-300">
                                        Ca {staff.originalShift}
                                      </span>
                                    )}</div>
                                  {staff.role && <span className={`text-[10px] ${isManager ? 'text-amber-600 font-bold' : 'text-gray-500'}`}>{staff.role}</span>}
                                </div>
                              </div>
                              {staff.tasksCount > 0 && (
                                <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-1.5 py-0.5 rounded border border-indigo-100">
                                  {staff.tasksCount} việc
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* Activity Log Compact */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50">
              <h2 className="text-base font-bold text-gray-800 flex items-center">
                <Activity className="w-4 h-4 mr-2 text-orange-500" />
                Nhật ký hoạt động
              </h2>
            </div>
            <div className="p-0">
              {activities.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">Chưa có hoạt động.</div>
              ) : (
                <ul className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
                  {activities.map(act => {
                    const action = act.action?.toUpperCase();
                    const isCreate = action === 'CREATE' || action === 'INSERT';
                    const isUpdate = action === 'UPDATE';
                    const isDelete = action === 'DELETE';
                    const actText = isCreate ? 'đã thêm mới' : isUpdate ? 'đã cập nhật' : isDelete ? 'đã xóa' : 'đã thay đổi';
                    
                    let entity = act.entity_type || '';
                    if (entity.includes('device')) entity = 'thiết bị';
                    else if (entity.includes('inventory')) entity = 'vật tư';
                    else if (entity.includes('hr_shift')) entity = 'công việc';
                    else if (entity.includes('hr_event')) entity = 'sự kiện';
                    
                    return (
                      <li key={act.id} className="p-4 hover:bg-gray-50/50 transition flex gap-3">
                        <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${isCreate ? 'bg-green-500' : isUpdate ? 'bg-blue-500' : isDelete ? 'bg-red-500' : 'bg-gray-500'}`}></div>
                        <div>
                          <p className="text-xs text-gray-800 leading-snug">
                            <span className="font-semibold">{act.user_name || act.user_email?.split('@')[0] || 'Hệ thống'}</span> {actText} <span className="font-semibold">{entity}</span>
                          </p>
                          <p className="text-[10px] text-gray-400 mt-1">{new Date(act.created_at).toLocaleString('vi-VN')}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
