const fs = require('fs');
const file = 'src/pages/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// The block to replace in fetchTodayData
const oldFetchLogic = `      if (assignments && assignments.length > 0) {
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
      }`;

const newFetchLogic = `      if (assignments && assignments.length > 0) {
        const mainGroups: Record<string, any> = {
          'M': { code: 'M', name: 'Ca Sáng (06:00 - 14:00)', employees: [] },
          'A': { code: 'A', name: 'Ca Chiều (14:00 - 22:00)', employees: [] },
          'N': { code: 'N', name: 'Ca Đêm (22:00 - 06:00)', employees: [] },
          'OTHER': { code: 'Khác', name: 'Hành chính / Nghỉ / Công tác', employees: [] }
        };

        assignments.forEach(a => {
           if (!a.shift || !a.employee) return;
           const code = a.shift.code.toUpperCase();
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

        // Determine current shift based on real time
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

        // Sort employees inside groups
        finalGroups.forEach(sg => {
           sg.employees.sort((x: any, y: any) => {
              const xIsManager = x.role?.toLowerCase().includes('quản lý') || x.role?.toLowerCase().includes('ca trưởng') || x.role?.toLowerCase().includes('đội trưởng');
              const yIsManager = y.role?.toLowerCase().includes('quản lý') || y.role?.toLowerCase().includes('ca trưởng') || y.role?.toLowerCase().includes('đội trưởng');
              if (xIsManager && !yIsManager) return -1;
              if (!xIsManager && yIsManager) return 1;
              return y.tasksCount - x.tasksCount;
           });
        });
        
        setTodayStaff(finalGroups);
      } else {
        setTodayStaff([]);
      }`;

content = content.replace(oldFetchLogic, newFetchLogic);

// Add the badge in UI
const oldUi = `<span className="text-sm font-semibold text-gray-900 leading-tight">{staff.name}</span>`;
const newUi = `<div className="flex items-center"><span className="text-sm font-semibold text-gray-900 leading-tight">{staff.name}</span>
                                    {staff.originalShift !== shiftGroup.code && staff.originalShift !== 'OTHER' && (
                                      <span className="text-[9px] bg-gray-200 text-gray-700 font-bold px-1.5 py-0.5 rounded ml-2 shadow-sm border border-gray-300">
                                        Ca {staff.originalShift}
                                      </span>
                                    )}</div>`;
content = content.replace(new RegExp(oldUi.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newUi);


// Also update the manager highlight condition to include Đội trưởng
const oldManagerCond = `const isManager = staff.role?.toLowerCase().includes('quản lý') || staff.role?.toLowerCase().includes('ca trưởng');`;
const newManagerCond = `const isManager = staff.role?.toLowerCase().includes('quản lý') || staff.role?.toLowerCase().includes('ca trưởng') || staff.role?.toLowerCase().includes('đội trưởng');`;
content = content.replace(new RegExp(oldManagerCond.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newManagerCond);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed HR assignments to group by main shifts and time.');
