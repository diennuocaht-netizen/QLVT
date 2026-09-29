const fs = require('fs');
const file = 'src/pages/HRTasks.tsx';
let content = fs.readFileSync(file, 'utf8');

const fetchEnd = `      if (data) {
        setTasks(data);
        
        // Fetch group statuses for handover tasks`;

const newFetchEnd = `      if (data) {
        let finalTasks = data;
        if (selectedShiftId === 'all') {
          // When viewing all shifts in a day, only show the latest version of a task chain
          const groupMap = new Map();
          data.forEach(t => {
            const gid = t.group_id || t.id;
            if (!groupMap.has(gid)) {
              groupMap.set(gid, t);
            } else {
              const existing = groupMap.get(gid);
              if (new Date(t.created_at) > new Date(existing.created_at)) {
                groupMap.set(gid, t);
              }
            }
          });
          finalTasks = Array.from(groupMap.values());
        }
        setTasks(finalTasks);
        
        // Fetch group statuses for handover tasks (using finalTasks)`;

content = content.replace(fetchEnd, newFetchEnd);

// We must also update the reference from `data` to `finalTasks` in the group mapping logic
content = content.replace(
  "const handoverGroupIds = data.filter(t => t.status === 'handover').map(t => t.group_id || t.id);",
  "const handoverGroupIds = finalTasks.filter(t => t.status === 'handover').map(t => t.group_id || t.id);"
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed duplicate tasks in All Shifts view.');
