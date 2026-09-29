const fs = require('fs');
const file = 'src/pages/Dashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// Ensure correct Vietnamese encoding for mainGroups
const fetchReplacementOldRegex = /const mainGroups: Record<string, any> = \{[\s\S]*?setTodayStaff\(\[\]\);\s*\}/;

const newFetchLogic = `const mainGroups: Record<string, any> = {
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
        }`;

content = content.replace(fetchReplacementOldRegex, newFetchLogic);

// Now fix the UI to ONLY show badge if originalShift is like M1, N1, AD
const uiOldRegex = /<div className="flex items-center"><span className="text-sm font-semibold text-gray-900 leading-tight">\{staff\.name\}<\/span>[\s\S]*?<\/div>\s*\{staff\.role &&/g;

const uiNew = `<div className="flex items-center"><span className="text-sm font-semibold text-gray-900 leading-tight">{staff.name}</span>
                                    {staff.originalShift !== shiftGroup.code && staff.originalShift !== 'OTHER' && staff.originalShift !== 'M' && staff.originalShift !== 'A' && staff.originalShift !== 'N' && staff.originalShift !== '' && (
                                      <span className="text-[9px] bg-gray-200 text-gray-700 font-bold px-1.5 py-0.5 rounded ml-2 shadow-sm border border-gray-300">
                                        Ca {staff.originalShift}
                                      </span>
                                    )}</div>
                                  {staff.role &&`;

content = content.replace(uiOldRegex, uiNew);

// Fix manager check in UI
const managerUIRegex = /const isManager = staff\.role\?\.toLowerCase\(\)\.includes\('qu\?n ly'\) \|\| staff\.role\?\.toLowerCase\(\)\.includes\('ca tru\?ng'\) \|\| staff\.role\?\.toLowerCase\(\)\.includes\('d\?i tru\?ng'\);/g;
const newManagerUI = `const roleLower = (staff.role || '').toLowerCase();
                          const isManager = roleLower.includes('quản lý') || roleLower.includes('ca trưởng') || roleLower.includes('đội trưởng') || roleLower.includes('đội phó');`;

content = content.replace(managerUIRegex, newManagerUI);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed HR assignments script.');
