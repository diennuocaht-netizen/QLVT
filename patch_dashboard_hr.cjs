const fs = require('fs');
const file = 'src/pages/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// We need to modify fetchTodayData to fetch shift_assignments too

const fetchReplacementOld = `      // Extract unique staff for today
      const staffMap = new Map();
      tasks.forEach(t => {
        if (t.assignee) {
          if (!staffMap.has(t.assignee.id)) {
            staffMap.set(t.assignee.id, { name: t.assignee.display_name, tasksCount: 1 });
          } else {
            staffMap.get(t.assignee.id).tasksCount++;
          }
        }
      });
      setTodayStaff(Array.from(staffMap.values()));
    }

    // Fetch Ongoing Events`;

const fetchReplacementNew = `      // Get task counts by user display_name
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
        // Group by shift
        const shiftGroups = new Map();
        assignments.forEach(a => {
           if (!a.shift || !a.employee) return;
           if (!shiftGroups.has(a.shift.code)) {
              shiftGroups.set(a.shift.code, { code: a.shift.code, name: a.shift.name, employees: [] });
           }
           
           const empNameLower = a.employee.full_name.trim().toLowerCase();
           shiftGroups.get(a.shift.code).employees.push({
              name: a.employee.full_name,
              role: a.employee.role,
              tasksCount: taskCountsMap.get(empNameLower) || 0
           });
        });
        
        // Convert to array and sort employees within shifts (Managers first)
        const staffByShift = Array.from(shiftGroups.values()).map(sg => {
           sg.employees.sort((x, y) => {
              const xIsManager = x.role?.toLowerCase().includes('quản lý') || x.role?.toLowerCase().includes('ca trưởng');
              const yIsManager = y.role?.toLowerCase().includes('quản lý') || y.role?.toLowerCase().includes('ca trưởng');
              if (xIsManager && !yIsManager) return -1;
              if (!xIsManager && yIsManager) return 1;
              return y.tasksCount - x.tasksCount; // Then by tasks count
           });
           return sg;
        });
        
        setTodayStaff(staffByShift);
      } else {
        setTodayStaff([]);
      }
    }

    // Fetch Ongoing Events`;

content = content.replace(fetchReplacementOld, fetchReplacementNew);

// Now update the UI mapping
const uiOld = `              {todayStaff.length === 0 ? (
                <div className="py-4 text-center text-sm text-gray-500">Chưa có ai được phân công.</div>
              ) : (
                <div className="space-y-3">
                  {todayStaff.map((staff, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50 border border-emerald-100">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs mr-3">
                          {staff.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{staff.name}</span>
                      </div>
                      <span className="text-xs bg-white text-emerald-600 font-bold px-2 py-1 rounded-full shadow-sm">
                        {staff.tasksCount} việc
                      </span>
                    </div>
                  ))}
                </div>
              )}`;

const uiNew = `              {todayStaff.length === 0 ? (
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
                          const isManager = staff.role?.toLowerCase().includes('quản lý') || staff.role?.toLowerCase().includes('ca trưởng');
                          return (
                            <div key={sIdx} className="flex items-center justify-between p-2 rounded bg-white border border-emerald-50 shadow-sm">
                              <div className="flex items-center">
                                <div className={\`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs mr-2 \${isManager ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300' : 'bg-emerald-100 text-emerald-700'}\`}>
                                  {staff.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold text-gray-900 leading-tight">{staff.name}</span>
                                  {staff.role && <span className={\`text-[10px] \${isManager ? 'text-amber-600 font-bold' : 'text-gray-500'}\`}>{staff.role}</span>}
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
              )}`;

content = content.replace(uiOld, uiNew);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed HR assignments display grouped by shift.');
