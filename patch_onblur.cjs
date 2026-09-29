const fs = require('fs');
const file = 'src/components/hr/EventDetailsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const updateTask = async \(taskId: string, updates: any\) => \{[\s\S]*?  \};/;
const newLogic = `const updateLocalTask = (taskId: string, updates: any) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, ...updates } : t));
  };

  const saveTaskToDb = async (taskId: string, updates: any) => {
    const { error } = await supabase.from('hr_event_tasks').update(updates).eq('id', taskId);
    if (error) {
      console.error(error);
      fetchTasks();
    } else if (updates.result_note || updates.status === 'done') {
      logActivity({
        action: 'update_event_task',
        entityType: 'hr_event',
        entityId: event.id,
        details: { taskId, updates }
      });
    }
  };

  const updateTask = async (taskId: string, updates: any) => {
    updateLocalTask(taskId, updates);
    saveTaskToDb(taskId, updates);
  };`;

content = content.replace(regex, newLogic);
content = content.replace(/onChange=\{\(e\) => updateTask\(task\.id, \{ title: e\.target\.value \}\)\}/g, "onChange={(e) => updateLocalTask(task.id, { title: e.target.value })} onBlur={(e) => saveTaskToDb(task.id, { title: e.target.value })}");
content = content.replace(/onChange=\{\(e\) => updateTask\(task\.id, \{ result_note: e\.target\.value \}\)\}\s*onBlur=\{\(e\) => updateTask\(task\.id, \{ result_note: e\.target\.value \}\)\}/g, "onChange={(e) => updateLocalTask(task.id, { result_note: e.target.value })} onBlur={(e) => saveTaskToDb(task.id, { result_note: e.target.value })}");

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed onBlur spam!');
