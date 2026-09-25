import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../supabase-client';
import { ShiftTeam, ShiftEmployee, ShiftType, ShiftAssignment, ShiftMonthlyNote } from '../types/shift';
import { Calendar, LayoutGrid, ChevronLeft, ChevronRight, Save, Plus, Users, Upload, Search, Trash2, X, RotateCcw, CheckSquare } from 'lucide-react';
import { logActivity } from '../utils/activityLogger';

import { useAuth } from '../contexts/AuthContext';

export const ShiftSchedule: React.FC = () => {
  const { profile } = useAuth();
  const canEdit = profile?.role === 'admin' || profile?.role === 'manager';
  const [viewMode, setViewMode] = useState<'matrix' | 'calendar'>('matrix');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  const [teams, setTeams] = useState<ShiftTeam[]>([]);
  const [employees, setEmployees] = useState<ShiftEmployee[]>([]);
  const [shiftTypes, setShiftTypes] = useState<ShiftType[]>([]);
  
  // Maps for quick access
  const [assignments, setAssignments] = useState<Record<string, Record<string, string>>>({}); // employee_id -> date -> shift_type_id
  const [monthlyNotes, setMonthlyNotes] = useState<Record<string, string>>({}); // employee_id -> note

  // Local state for edits before save
  const [editedAssignments, setEditedAssignments] = useState<Record<string, Record<string, string>>>({});
  const [editedEmployees, setEditedEmployees] = useState<Record<string, {full_name?: string, role?: string}>>({});
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedSummaryShiftId, setSelectedSummaryShiftId] = useState<string | null>(null);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [bulkDate, setBulkDate] = useState<string>('');
  const [bulkShift, setBulkShift] = useState<string>('');
  const [monthCreatedState, setMonthCreatedState] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    fetchAllData();
  }, [currentDate.getMonth(), currentDate.getFullYear()]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // 1. Fetch base data
      const [teamsRes, empRes, typesRes] = await Promise.all([
        supabase.from('shift_teams').select('*').order('order_index'),
        supabase.from('shift_employees').select('*, team:shift_teams(*)').order('order_index'),
        supabase.from('shift_types').select('*').order('order_index')
      ]);
      
      if (teamsRes.error) throw teamsRes.error;
      if (empRes.error) throw empRes.error;
      if (typesRes.error) throw typesRes.error;
      
      setTeams(teamsRes.data || []);
      const fetchedEmployees = empRes.data || [];
      setEmployees(fetchedEmployees);
      setShiftTypes(typesRes.data || []);

      // 2. Fetch month data if employees exist
      if (fetchedEmployees.length > 0) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1;
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
          const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
        const monthYearStr = `${year}-${month.toString().padStart(2, '0')}`;

        const [assignRes, notesRes] = await Promise.all([
          supabase.from('shift_assignments').select('*').gte('date', startDate).lte('date', endDate),
          supabase.from('shift_monthly_notes').select('*').eq('month_year', monthYearStr)
        ]);

        if (assignRes.error) throw assignRes.error;
        if (notesRes.error) throw notesRes.error;

        // Process assignments
        const assignMap: Record<string, Record<string, string>> = {};
        assignRes.data?.forEach(a => {
          if (!assignMap[a.employee_id]) assignMap[a.employee_id] = {};
          assignMap[a.employee_id][a.date] = a.shift_type_id;
        });
        setAssignments(assignMap);
        setEditedAssignments({}); // Reset edits
        setEditedEmployees({});

        // Process notes
        const notesMap: Record<string, string> = {};
        notesRes.data?.forEach(n => {
          notesMap[n.employee_id] = n.note;
        });
        setMonthlyNotes(notesMap);
      } else {
        setAssignments({});
        setMonthlyNotes({});
        setEditedAssignments({});
        setEditedEmployees({});
      }

    } catch (error) {
      console.error('Error fetching data', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({
        dateStr: `${year}-${(month + 1).toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`,
        dayNum: i,
        dayOfWeek: d.getDay() // 0 is Sunday, 1 is Monday...
      });
    }
    return days;
  };

  const days = useMemo(() => getDaysInMonth(), [currentDate]);
  const today = new Date();
  const isCurrentMonth = today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
  
  const getDayLabel = (dayIndex: number) => {
    const labels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return labels[dayIndex];
  };

  const getShiftValue = (empId: string, dateStr: string) => {
    return editedAssignments[empId]?.[dateStr] !== undefined 
      ? editedAssignments[empId][dateStr] 
      : assignments[empId]?.[dateStr];
  };

  
  const handleDiscard = () => {
    if (window.confirm('Bạn có chắc chắn muốn bỏ qua tất cả các thay đổi chưa lưu?')) {
      setEditedAssignments({});
      setEditedEmployees({});
      setSelectedRowIds([]);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRowIds(filteredEmployees.map(emp => emp.id));
    } else {
      setSelectedRowIds([]);
    }
  };

  const handleSelectRow = (empId: string) => {
    setSelectedRowIds(prev => 
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  const handleApplyBulk = () => {
    if (selectedRowIds.length === 0 || !bulkDate || !bulkShift) return;
    setEditedAssignments(prev => {
      const next = { ...prev };
      selectedRowIds.forEach(empId => {
        if (!next[empId]) next[empId] = {};
        next[empId][bulkDate] = bulkShift === 'clear' ? '' : bulkShift;
      });
      return next;
    });
    alert(`Đã áp dụng thay đổi cho ${selectedRowIds.length} nhân sự!`);
  };

  const handleShiftChange = (empId: string, dateStr: string, shiftTypeId: string) => {
    setEditedAssignments(prev => ({
      ...prev,
      [empId]: {
        ...(prev[empId] || {}),
        [dateStr]: shiftTypeId
      }
    }));
  };

  const calculateStats = (empId: string) => {
    let offDays = 0;
    let leaveDays = 0;
    let nightShifts = 0;

    days.forEach(d => {
      const sId = getShiftValue(empId, d.dateStr);
      if (sId) {
        const sType = shiftTypes.find(t => t.id === sId);
        if (sType) {
          if (sType.is_off_day) offDays++;
          if (sType.is_leave_day) leaveDays++;
          if (sType.is_night_shift) nightShifts++;
        }
      }
    });

    return { offDays, leaveDays, nightShifts };
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const upserts: any[] = [];
      Object.keys(editedAssignments).forEach(empId => {
        Object.keys(editedAssignments[empId]).forEach(dateStr => {
          upserts.push({
            employee_id: empId,
            date: dateStr,
            shift_type_id: editedAssignments[empId][dateStr] || null
          });
        });
      });

      // save employee edits
      const empUpserts: any[] = [];
      Object.keys(editedEmployees).forEach(empId => {
        const emp = employees.find(e => e.id === empId);
        if (emp) {
          empUpserts.push({
            id: empId,
            full_name: editedEmployees[empId].full_name ?? emp.full_name,
            role: editedEmployees[empId].role ?? emp.role,
            team_id: emp.team_id,
            order_index: emp.order_index
          });
        }
      });
      if (empUpserts.length > 0) {
        const { error } = await supabase.from('shift_employees').upsert(empUpserts);
        if (error) throw error;
      }

      if (upserts.length > 0) {
        const { error } = await supabase.from('shift_assignments').upsert(upserts, { onConflict: 'employee_id,date' });
        if (error) throw error;
        
        // Merge edited back to assignments
        const newAssigns = { ...assignments };
        Object.keys(editedAssignments).forEach(empId => {
          if (!newAssigns[empId]) newAssigns[empId] = {};
          Object.keys(editedAssignments[empId]).forEach(dateStr => {
            newAssigns[empId][dateStr] = editedAssignments[empId][dateStr];
          });
        });
        setAssignments(newAssigns);
        setEditedAssignments({});
        setEditedEmployees({});
        alert('Lưu phân ca thành công!');
      } else {
        if (empUpserts.length > 0) {
          setEditedEmployees({});
          alert('Lưu thay đổi thành công!');
          fetchAllData();
        } else {
          alert('Không có thay đổi nào để lưu.');
        }
      }
    } catch (error) {
      console.error('Error saving assignments', error);
      alert('Đã xảy ra lỗi khi lưu.');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncEmployees = async () => {
    if (!window.confirm('Bạn có muốn đồng bộ danh sách nhân sự từ hệ thống tài khoản không? Các nhân sự mới sẽ được thêm vào bảng.')) return;
    setSyncing(true);
    try {
      const { data: users, error } = await supabase.from('users').select('*');
      if (error) throw error;
      if (!users || users.length === 0) {
        alert('Không tìm thấy tài khoản nào trong hệ thống!');
        return;
      }
      
      const newEmployees = users
        .filter((u: any) => !employees.some(e => e.full_name.toLowerCase() === (u.display_name || u.email).toLowerCase()))
        .map((u: any, index: number) => ({
          full_name: u.display_name || u.email,
          role: u.job_title || '', 
          order_index: employees.length + index
        }));

      // Check for users to delete
      const toDelete = employees.filter(emp => 
        !users.some((u: any) => 
          (u.display_name && u.display_name.toLowerCase() === emp.full_name.toLowerCase()) ||
          (u.email && u.email.toLowerCase() === emp.full_name.toLowerCase())
        )
      );

      if (toDelete.length > 0) {
        const { error: delError } = await supabase.from('shift_employees').delete().in('id', toDelete.map(e => e.id));
        if (delError) throw delError;
      }

      if (newEmployees.length > 0) {
        const { error: insertError } = await supabase.from('shift_employees').insert(newEmployees);
        if (insertError) throw insertError;
      }
      
      // Check for users to update job_title
      let updatedCount = 0;
      for (const emp of employees) {
        const u = users.find((u: any) => 
          (u.display_name && u.display_name.toLowerCase() === emp.full_name.toLowerCase()) ||
          (u.email && u.email.toLowerCase() === emp.full_name.toLowerCase())
        );
        if (u) {
          const userJobTitle = u.job_title || '';
          const currentRole = emp.role || '';
          if (userJobTitle !== currentRole) {
            await supabase.from('shift_employees').update({ role: userJobTitle }).eq('id', emp.id);
            updatedCount++;
          }
        }
      }
      
      if (newEmployees.length > 0 || toDelete.length > 0 || updatedCount > 0) {
        alert(`Đồng bộ hoàn tất: Thêm ${newEmployees.length} mới, Xóa ${toDelete.length} cũ, Cập nhật chức danh ${updatedCount} người.`);
        fetchAllData();
      } else {
        alert('Danh sách nhân sự và chức danh đã được đồng bộ đầy đủ, không có sự thay đổi.');
      }
    } catch (error) {
      console.error('Error syncing employees:', error);
      alert('Đồng bộ thất bại. Vui lòng thử lại.');
    } finally {
      setSyncing(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const XLSX = await import('xlsx');
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        let sheetName = workbook.SheetNames[0];
        if (workbook.SheetNames.length > 1) {
          // Try to guess sheet
          const guess = workbook.SheetNames.find(s => {
            const sn = s.toLowerCase().replace(/\s/g, '');
            return sn.includes(`t${month}`) && sn.includes(`${year}`);
          });
          
          let listStr = workbook.SheetNames.map((s, idx) => `${idx + 1}. ${s}`).join('\n');
          // if too long, truncate
          // Removed truncation to allow showing all sheets
          
          const guessIndex = guess ? workbook.SheetNames.indexOf(guess) + 1 : 1;
          const userInput = window.prompt(`File Excel có ${workbook.SheetNames.length} Sheets.\nHệ thống dự đoán bạn muốn nhập dữ liệu cho tháng ${month}/${year}.\n\nDanh sách Sheets:\n${listStr}\n\nVui lòng nhập SỐ THỨ TỰ của Sheet bạn muốn import:`, guessIndex.toString());
          
          if (!userInput) return; // cancel
          const selIdx = parseInt(userInput) - 1;
          if (isNaN(selIdx) || selIdx < 0 || selIdx >= workbook.SheetNames.length) {
            alert('Số thứ tự không hợp lệ!');
            return;
          }
          sheetName = workbook.SheetNames[selIdx];
        }
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to 2D array
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        // Find header row (the one with 1, 2, 3... at least up to 28)
        let headerRowIdx = -1;
        let dateColMap: Record<number, number> = {}; // day -> colIndex

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          let foundDays = 0;
          let tempMap: Record<number, number> = {};
          
          if (Array.isArray(row)) {
            for (let j = 0; j < row.length; j++) {
              const cellVal = parseInt(row[j] as any);
              if (!isNaN(cellVal) && cellVal >= 1 && cellVal <= 31) {
                tempMap[cellVal] = j;
                foundDays++;
              }
            }
          }
          
          if (foundDays >= 28) {
            headerRowIdx = i;
            dateColMap = tempMap;
            break;
          }
        }

        if (headerRowIdx === -1) {
          alert('Không tìm thấy dòng chứa ngày (1-31) trong file Excel.');
          return;
        }

        // Now find employees and map their shifts
        const newEditedAssignments = { ...editedAssignments };
        let matchCount = 0;

        for (let i = headerRowIdx + 1; i < data.length; i++) {
          const row = data[i];
          if (!Array.isArray(row)) continue;

          // Find if any string in this row matches an employee name
          let matchedEmp: ShiftEmployee | undefined;
          for (const cell of row) {
            if (typeof cell === 'string' && cell.trim().length > 0) {
              const name = cell.trim().toLowerCase();
              const removeAccents = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              const nameStr = removeAccents(name).toLowerCase().trim().replace(/\s+/g, ' ');
              matchedEmp = employees.find(e => {
                const empNameStr = removeAccents(e.full_name).toLowerCase().trim().replace(/\s+/g, ' ');
                return nameStr === empNameStr; // TRULY EXACT MATCH to prevent shift collisions
              });
              if (matchedEmp) break;
            }
          }

          if (matchedEmp) {
            matchCount++;
            // Extract shifts for this employee
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            
            if (!newEditedAssignments[matchedEmp.id]) {
              newEditedAssignments[matchedEmp.id] = {};
            }

            // Loop through all days in month
            const daysInMonth = new Date(year, month, 0).getDate();
            for (let day = 1; day <= daysInMonth; day++) {
              const colIdx = dateColMap[day];
              if (colIdx !== undefined) {
                const cellVal = row[colIdx];
                if (typeof cellVal === 'string') {
                  const shiftCode = cellVal.trim().toUpperCase();
                  // find shift type id by code
                  const sType = shiftTypes.find(t => t.code.toUpperCase() === shiftCode);
                  if (sType) {
                    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                    newEditedAssignments[matchedEmp.id][dateStr] = sType.id;
                  }
                }
              }
            }
          }
        }

        setEditedAssignments(newEditedAssignments);
        // AUTO SAVE IMMEDIATELY
        const upserts: any[] = [];
        Object.keys(newEditedAssignments).forEach(empId => {
          Object.keys(newEditedAssignments[empId]).forEach(dateStr => {
            upserts.push({
              employee_id: empId,
              date: dateStr,
              shift_type_id: newEditedAssignments[empId][dateStr] || null
            });
          });
        });
        if (upserts.length > 0) {
          const { error } = await supabase.from('shift_assignments').upsert(upserts, { onConflict: 'employee_id,date' });
          if (error) throw error;
          alert(`Đã nạp và tự động lưu thành công lịch của ${matchCount} nhân sự.`);
          fetchAllData();
        } else {
          alert('Không có dữ liệu lịch nào được nạp.');
        }
        
      } catch (err) {
        console.error('Lỗi khi đọc file Excel:', err);
        alert('Có lỗi xảy ra khi đọc file Excel.');
      }
      
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDeleteEmployee = async (empId: string, empName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa nhân sự "${empName}" khỏi bảng phân ca? Mọi dữ liệu lịch của người này sẽ bị xóa.`)) return;
    try {
      setLoading(true);
      const { error } = await supabase.from('shift_employees').delete().eq('id', empId);
      if (error) throw error;
      alert('Đã xóa thành công!');
      fetchAllData();
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Lỗi khi xóa nhân sự.');
      setLoading(false);
    }
  };

  // Group employees by team for display
  const handleDrop = async (targetIdx: number) => {
    if (draggedIdx === null || draggedIdx === targetIdx) return;
    const newEmployees = [...employees];
    const [draggedEmp] = newEmployees.splice(draggedIdx, 1);
    newEmployees.splice(targetIdx, 0, draggedEmp);
    
    // update order_index locally
    const updatedEmployees = newEmployees.map((emp, i) => ({ ...emp, order_index: i }));
    setEmployees(updatedEmployees);
    setDraggedIdx(null);
    
    // save to DB quietly
    try {
      const upserts = updatedEmployees.map(e => ({ 
        id: e.id, 
        full_name: e.full_name,
        role: e.role,
        team_id: e.team_id,
        order_index: e.order_index 
      }));
      await supabase.from('shift_employees').upsert(upserts);
    } catch (e) {
      console.error('Error reordering', e);
    }
  };

  
  const filteredEmployees = useMemo(() => {
    if (!selectedEmpId) return employees;
    return employees.filter(e => e.id === selectedEmpId);
  }, [employees, selectedEmpId]);


  const employeesByTeam = useMemo(() => {
    const grouped: Record<string, ShiftEmployee[]> = {};
    employees.forEach(emp => {
      const tId = emp.team_id || 'unassigned';
      if (!grouped[tId]) grouped[tId] = [];
      grouped[tId].push(emp);
    });
    return grouped;
  }, [employees]);

  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const monthKey = `${year}-${month}`;
  
  const hasDataThisMonth = useMemo(() => {
    return Object.values(assignments).some(empAssignments => {
      return Object.keys(empAssignments).some(dateStr => dateStr.startsWith(`${year}-${month.toString().padStart(2, '0')}`));
    });
  }, [assignments, year, month]);
  
  const isMonthCreated = hasDataThisMonth || monthCreatedState[monthKey];

  
  const todaySummary = useMemo(() => {
    if (!isCurrentMonth) return null;
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
    const byShift: Record<string, string[]> = {};
    let totalScheduled = 0;
    
    // We compute summary based on ALL employees so it remains correct regardless of the filter, 
    // or maybe based on filteredEmployees? The user said "bên dưới bảng phân ca hãy thêm thẻ tổng hợp", 
    // typically summary applies to the whole team. Let's use `employees` instead of `filteredEmployees` for summary.
    employees.forEach(emp => {
      const sId = getShiftValue(emp.id, dateStr);
      if (sId) {
        if (!byShift[sId]) byShift[sId] = [];
        byShift[sId].push(emp.full_name);
        totalScheduled++;
      }
    });
    return { byShift, totalScheduled, totalEmployees: employees.length };
  }, [assignments, editedAssignments, employees, isCurrentMonth, year, month, today]);

  const hasUnsavedChanges = Object.keys(editedAssignments).length > 0 || Object.keys(editedEmployees).length > 0;

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Phân ca làm việc</h1>
          <p className="text-sm text-gray-500 mt-1">Quản lý lịch trực của nhân sự theo tháng</p>
        </div>
        <div className="flex space-x-3">
          <div className="relative">
            <Users className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              className="pl-9 pr-8 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 appearance-none bg-white cursor-pointer"
            >
              <option value="">-- Tất cả nhân sự --</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.full_name} {emp.role ? `(${emp.role})` : ''}</option>
              ))}
            </select>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-md">
              <button
                onClick={() => setViewMode('matrix')}
                className={`px-3 py-1.5 flex items-center text-sm font-medium rounded-md ${viewMode === 'matrix' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <LayoutGrid className="w-4 h-4 mr-2" /> Bảng
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1.5 flex items-center text-sm font-medium rounded-md ${viewMode === 'calendar' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Calendar className="w-4 h-4 mr-2" /> Lịch
              </button>
            </div>
          </div>
          
          {selectedRowIds.length > 0 && canEdit && (
            <div className="flex items-center space-x-2 bg-indigo-50 px-3 py-1.5 rounded-md border border-indigo-200 shadow-sm animate-fade-in mr-4">
              <span className="text-xs text-indigo-800 font-bold flex items-center">
                <CheckSquare className="w-4 h-4 mr-1" />
                Đã chọn {selectedRowIds.length}
              </span>
              <select className="text-xs border border-indigo-200 rounded px-1 py-1" value={bulkDate} onChange={e => setBulkDate(e.target.value)}>
                <option value="">-- Ngày --</option>
                {days.map(d => <option key={d.dateStr} value={d.dateStr}>{d.dayNum}/{month}</option>)}
              </select>
              <select className="text-xs border border-indigo-200 rounded px-1 py-1" value={bulkShift} onChange={e => setBulkShift(e.target.value)}>
                <option value="">-- Ca --</option>
                {shiftTypes.map(st => <option key={st.id} value={st.id}>{st.code}</option>)}
                <option value="clear" className="text-red-500 font-bold">Xóa ca (Trống)</option>
              </select>
              <button 
                onClick={handleApplyBulk}
                disabled={!bulkDate || !bulkShift}
                className="px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors shadow-sm font-medium"
              >
                Áp dụng
              </button>
            </div>
          )}
          
          <div className="flex space-x-2 text-xs">
            {canEdit && (
              <>
                <input 
                  type="file" 
                  accept=".xlsx, .xls" 
                  ref={fileInputRef} 
                  className="hidden" 
                  onChange={handleImportExcel} 
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-md flex items-center text-sm font-medium bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                  title="Nhập lịch từ file Excel"
                >
                  <Upload className="w-4 h-4 mr-1.5" />
                  Nhập Excel
                </button>
                
                <button
                  onClick={handleSyncEmployees}
                  disabled={syncing}
                  className="px-3 py-1.5 rounded-md flex items-center text-sm font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                  title="Đồng bộ lại nhân sự mới từ hệ thống"
                >
                  <Users className="w-4 h-4 mr-1.5" />
                  Đồng bộ NS
                </button>
                
                <button
                  onClick={handleDiscard}
                  disabled={!hasUnsavedChanges || saving}
                  className={`px-3 py-1.5 rounded-md flex items-center text-sm font-medium ${hasUnsavedChanges ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed hidden'}`}
                  title="Bỏ qua các thay đổi chưa lưu"
                >
                  <RotateCcw className="w-4 h-4 mr-1.5" />
                  Hủy thay đổi
                </button>
                
                <button
                  onClick={handleSave}
                  disabled={!hasUnsavedChanges || saving}
                  className={`px-4 py-1.5 rounded-md flex items-center text-sm shadow-sm font-medium ${hasUnsavedChanges ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                >
                  {saving ? <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save className="w-4 h-4 mr-1.5" />}
                  Lưu thay đổi
                </button>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-4">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-full"><ChevronLeft className="w-5 h-5" /></button>
          <h2 className="text-lg font-bold text-gray-800 w-32 text-center">Tháng {currentDate.getMonth() + 1} / {currentDate.getFullYear()}</h2>
          <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-full"><ChevronRight className="w-5 h-5" /></button>
        </div>
        
          {selectedRowIds.length > 0 && canEdit && (
            <div className="flex items-center space-x-2 bg-indigo-50 px-3 py-1.5 rounded-md border border-indigo-200 shadow-sm animate-fade-in mr-4">
              <span className="text-xs text-indigo-800 font-bold flex items-center">
                <CheckSquare className="w-4 h-4 mr-1" />
                Đã chọn {selectedRowIds.length}
              </span>
              <select className="text-xs border border-indigo-200 rounded px-1 py-1" value={bulkDate} onChange={e => setBulkDate(e.target.value)}>
                <option value="">-- Ngày --</option>
                {days.map(d => <option key={d.dateStr} value={d.dateStr}>{d.dayNum}/{month}</option>)}
              </select>
              <select className="text-xs border border-indigo-200 rounded px-1 py-1" value={bulkShift} onChange={e => setBulkShift(e.target.value)}>
                <option value="">-- Ca --</option>
                {shiftTypes.map(st => <option key={st.id} value={st.id}>{st.code}</option>)}
                <option value="clear" className="text-red-500 font-bold">Xóa ca (Trống)</option>
              </select>
              <button 
                onClick={handleApplyBulk}
                disabled={!bulkDate || !bulkShift}
                className="px-2 py-1 bg-indigo-600 text-white rounded text-xs hover:bg-indigo-700 disabled:bg-indigo-300 transition-colors shadow-sm font-medium"
              >
                Áp dụng
              </button>
            </div>
          )}
          <div className="flex space-x-2 text-xs">
          {shiftTypes.map(st => (
            <div key={st.id} className="flex items-center space-x-1 border px-2 py-1 rounded" style={{ backgroundColor: st.bg_color === 'transparent' ? '#fff' : st.bg_color }}>
              <span className="font-bold" style={{ color: st.text_color }}>{st.code}</span>
              <span className="text-gray-600">: {st.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : !isMonthCreated ? (
          <div className="flex-1 flex flex-col items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm">
            <Calendar className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tháng {month}/{year} chưa có dữ liệu lịch</h3>
            <p className="text-gray-500 mb-6">Bạn cần khởi tạo lịch cho tháng này trước khi bắt đầu phân ca.</p>
            {canEdit && (
              <button
                onClick={() => setMonthCreatedState(prev => ({ ...prev, [monthKey]: true }))}
                className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 font-medium shadow-sm flex items-center"
              >
                <Plus className="w-5 h-5 mr-2" />
                Khởi tạo lịch tháng {month}/{year}
              </button>
            )}
          </div>
        ) : viewMode === 'matrix' ? (
          <div className="flex-1 overflow-auto">
            <table className="w-full border-collapse text-sm min-w-max">
              <thead className="sticky top-0 bg-white z-10 shadow-sm">
                <tr>
                  <th className="border border-gray-300 p-1 text-center bg-gray-50 w-8">
                      {canEdit && (
                        <input 
                          type="checkbox" 
                          className="rounded text-indigo-600 focus:ring-indigo-500" 
                          checked={selectedRowIds.length === filteredEmployees.length && filteredEmployees.length > 0} 
                          onChange={handleSelectAll} 
                        />
                      )}
                    </th>
                    <th className="border border-gray-300 p-2 text-center bg-gray-50 w-8">STT</th>
                  <th className="border border-gray-300 p-2 text-left bg-gray-50 w-48 sticky left-0 z-20">Họ và tên</th>
                  <th className="border border-gray-300 p-2 text-left bg-gray-50 w-40">Chức danh</th>
                  {days.map(d => (
                    <th key={d.dateStr} className={`border border-gray-300 p-1 text-center min-w-[32px] ${d.dayOfWeek === 0 || d.dayOfWeek === 6 ? 'bg-orange-50' : 'bg-gray-50'}`}>
                      <div className="text-[10px] text-gray-500">{getDayLabel(d.dayOfWeek)}</div>
                      <div className={`font-bold ${d.dayOfWeek === 0 ? 'text-red-500' : ''}`}>{d.dayNum}</div>
                    </th>
                  ))}
                  <th className="border border-gray-300 p-2 text-center bg-gray-100 w-12 text-xs">Nghỉ OFF</th>
                  <th className="border border-gray-300 p-2 text-center bg-gray-100 w-12 text-xs">Nghỉ Phép</th>
                  <th className="border border-gray-300 p-2 text-center bg-red-100 text-red-800 w-12 text-xs font-bold">Ca N</th>
                  <th className="border border-gray-300 p-2 text-center bg-gray-50 w-16">RMIT</th>
                  {canEdit && <th className="border border-gray-300 p-2 text-center bg-gray-50 w-10"></th>}
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={days.length + 7} className="p-8 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <Users className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="mb-4">Chưa có dữ liệu nhân sự. Bạn có muốn đồng bộ từ danh sách tài khoản hiện tại không?</p>
                        <button
                          onClick={handleSyncEmployees}
                          disabled={syncing}
                          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center disabled:opacity-50"
                        >
                          {syncing ? 'Đang đồng bộ...' : 'Đồng bộ danh sách nhân sự'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp, idx) => {
                    const stats = calculateStats(emp.id);
                    const teamColor = emp.team?.color_code || 'transparent';
                    
                    return (
                      <tr 
                          key={emp.id} 
                          className={`hover:bg-gray-50 ${draggedIdx === idx ? 'opacity-50 bg-indigo-50' : ''}`}
                          draggable={canEdit}
                          onDragStart={() => setDraggedIdx(idx)}
                          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                          onDrop={(e) => { e.preventDefault(); handleDrop(idx); }}
                        >
                        <td className="border border-gray-300 p-1 text-center bg-white cursor-pointer" onClick={() => canEdit && handleSelectRow(emp.id)}>
                            {canEdit && (
                              <input 
                                type="checkbox" 
                                className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                checked={selectedRowIds.includes(emp.id)}
                                onChange={() => handleSelectRow(emp.id)}
                                onClick={e => e.stopPropagation()}
                              />
                            )}
                          </td>
                          <td className="border border-gray-300 p-2 text-center font-medium">{idx + 1}</td>
                        <td className="border border-gray-300 p-0 font-bold sticky left-0 z-10 bg-white" style={{ backgroundColor: teamColor !== 'transparent' ? teamColor : '#fff' }}>
                          <input 
                            type="text" 
                            className="w-full h-full border-0 bg-transparent px-2 py-2 focus:ring-1 focus:ring-indigo-500 font-bold text-sm"
                            value={editedEmployees[emp.id]?.full_name ?? emp.full_name}
                            onChange={(e) => setEditedEmployees(prev => ({ ...prev, [emp.id]: { ...prev[emp.id], full_name: e.target.value } }))}
                            readOnly={!canEdit}
                          />
                        </td>
                        <td className="border border-gray-300 p-0 text-xs" style={{ backgroundColor: teamColor !== 'transparent' ? teamColor : '#fff' }}>
                          <input 
                            type="text" 
                            className="w-full h-full border-0 bg-transparent px-2 py-2 focus:ring-1 focus:ring-indigo-500 text-xs"
                            placeholder="Chức danh..."
                            value={editedEmployees[emp.id]?.role ?? emp.role ?? ''}
                            onChange={(e) => setEditedEmployees(prev => ({ ...prev, [emp.id]: { ...prev[emp.id], role: e.target.value } }))}
                            readOnly={!canEdit}
                          />
                        </td>
                        
                        {days.map(d => {
                            const sId = getShiftValue(emp.id, d.dateStr);
                            const sType = shiftTypes.find(t => t.id === sId);
                            const isToday = isCurrentMonth && d.dayNum === today.getDate();
                            
                            return (
                              <td key={d.dateStr} className={`border border-gray-300 p-0 text-center relative group ${isToday ? 'bg-blue-50 border-blue-500 border-x-2 relative z-0' : ''}`}>
                              <select 
                                value={sId || ''} 
                                onChange={(e) => handleShiftChange(emp.id, d.dateStr, e.target.value)}
                                disabled={!canEdit}
                                className={`w-full h-full border-0 bg-transparent text-center focus:ring-1 focus:ring-indigo-500 appearance-none font-bold text-sm ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
                                style={{ 
                                  color: sType?.text_color || 'inherit', 
                                  backgroundColor: sType?.bg_color !== 'transparent' ? sType?.bg_color : 'transparent' 
                                }}
                              >
                                <option value=""></option>
                                {shiftTypes.map(st => (
                                  <option key={st.id} value={st.id}>{st.code}</option>
                                ))}
                              </select>
                            </td>
                          );
                        })}
                        
                        <td className="border border-gray-300 p-2 text-center font-bold bg-gray-50">{stats.offDays}</td>
                        <td className="border border-gray-300 p-2 text-center font-bold bg-gray-50">{stats.leaveDays}</td>
                        <td className="border border-gray-300 p-2 text-center font-bold bg-red-50 text-red-600">{stats.nightShifts}</td>
                        <td className="border border-gray-300 p-1 text-center">
                          <input 
                            type="text" 
                            className="w-full h-full border-0 bg-transparent text-center text-xs font-bold focus:ring-0" 
                            value={monthlyNotes[emp.id] || ''}
                            readOnly
                            title="Cột này cần cập nhật qua form riêng (tương lai)"
                          />
                        </td>
                        <td className="border border-gray-300 p-1 text-center bg-gray-50">
                          {canEdit && (
                            <button 
                              onClick={() => handleDeleteEmployee(emp.id, emp.full_name)}
                              className="p-1 text-red-500 hover:bg-red-100 rounded"
                              title="Xóa nhân sự"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex-1 p-4 overflow-auto bg-gray-50">
            {/* Calendar View Implementation */}
            <div className="grid grid-cols-7 gap-4">
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, idx) => (
                <div key={day} className={`text-center font-bold py-2 ${idx === 0 ? 'text-red-500' : 'text-gray-700'}`}>{day}</div>
              ))}
              
              {/* Empty cells for starting day offset */}
              {Array.from({ length: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-transparent"></div>
              ))}
              
              {/* Day cells */}
              {days.map(d => {
                // Group employees by shift for this day
                const shiftGroups: Record<string, string[]> = {};
                filteredEmployees.forEach(emp => {
                  const sId = getShiftValue(emp.id, d.dateStr);
                  if (sId) {
                    if (!shiftGroups[sId]) shiftGroups[sId] = [];
                    // Get short name (first name)
                    const parts = emp.full_name.split(' ');
                    shiftGroups[sId].push(parts[parts.length - 1]);
                  }
                });

                return (
                  <div key={d.dateStr} className="bg-white rounded-lg border border-gray-200 shadow-sm min-h-[120px] flex flex-col">
                    <div className={`p-1 text-center font-bold text-sm border-b ${d.dayOfWeek === 0 ? 'text-red-500 bg-red-50' : 'bg-gray-100'}`}>
                      {d.dayNum}
                    </div>
                    <div className="p-1 flex-1 space-y-1 overflow-y-auto max-h-[150px]">
                      {shiftTypes.map(st => {
                        const emps = shiftGroups[st.id];
                        if (!emps || emps.length === 0) return null;
                        return (
                          <div key={st.id} className="text-[10px] leading-tight flex items-start">
                            <span className="font-bold min-w-[20px] shrink-0" style={{ color: st.text_color }}>{st.code}:</span>
                            <span className="text-gray-600 ml-1">{emps.join(', ')}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Today Summary */}
        {isMonthCreated && todaySummary && (
          <div className="mt-4 flex flex-col gap-2 shrink-0">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-sm flex flex-wrap gap-3 items-center">
              <div className="font-bold text-blue-900 mr-2 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Tổng hợp ca hôm nay ({today.toLocaleDateString('vi-VN')}):
              </div>
              <div className="bg-white px-3 py-1 rounded shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50" onClick={() => setSelectedSummaryShiftId(null)}>
                <span className="text-gray-500 text-sm">Tổng nhân sự: </span>
                <span className="font-bold">{todaySummary.totalEmployees}</span>
              </div>
              <div className="bg-white px-3 py-1 rounded shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50" onClick={() => setSelectedSummaryShiftId('all')}>
                <span className="text-gray-500 text-sm">Có lịch: </span>
                <span className="font-bold text-indigo-600">{todaySummary.totalScheduled}</span>
              </div>
              {shiftTypes.map(st => {
                const names = todaySummary.byShift[st.id] || [];
                if (names.length === 0) return null;
                const isSelected = selectedSummaryShiftId === st.id;
                return (
                  <div 
                    key={st.id} 
                    onClick={() => setSelectedSummaryShiftId(isSelected ? null : st.id)}
                    className={`bg-white px-3 py-1 rounded shadow-sm border cursor-pointer transition-colors ${isSelected ? 'ring-2 ring-offset-1' : 'hover:bg-gray-50'}`} 
                    style={{ borderColor: st.text_color, ...(isSelected ? { ringColor: st.text_color } : {}) }}
                    title="Click để xem danh sách"
                  >
                    <span className="font-bold text-sm mr-1" style={{ color: st.text_color }}>Ca {st.code}:</span>
                    <span className="font-bold">{names.length}</span>
                  </div>
                );
              })}
            </div>
            
            {/* Display list of names for selected tag */}
            {selectedSummaryShiftId && (
              <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm animate-fade-in text-sm flex flex-wrap gap-2">
                <span className="font-bold text-gray-700 mr-2">
                  {selectedSummaryShiftId === 'all' 
                    ? 'Nhân sự có lịch hôm nay:' 
                    : `Nhân sự làm Ca ${shiftTypes.find(t => t.id === selectedSummaryShiftId)?.code}:`}
                </span>
                
                {selectedSummaryShiftId === 'all' 
                  ? Object.values(todaySummary.byShift).flat().map((name, i) => (
                      <span key={i} className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full">{name}</span>
                    ))
                  : (todaySummary.byShift[selectedSummaryShiftId] || []).map((name, i) => (
                      <span key={i} className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full border" style={{ borderColor: shiftTypes.find(t => t.id === selectedSummaryShiftId)?.text_color }}>
                        {name}
                      </span>
                    ))
                }
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
