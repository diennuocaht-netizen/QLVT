const fs = require('fs');
const file = 'src/components/hr/EventDetailsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// We will separate local update and DB save.
const fixLocalState = `
  const updateLocalTask = (taskId: string, updates: any) => {
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
`;

content = content.replace("  const updateTask = async (taskId: string, updates: any) => {", fixLocalState + "\n  const updateTask = async (taskId: string, updates: any) => {");

// Replace onChange with updateLocalTask and onBlur with saveTaskToDb for text inputs
content = content.replace(/onChange=\{\(e\) => updateTask\(task\.id, \{ title: e\.target\.value \}\)\}/g, "onChange={(e) => updateLocalTask(task.id, { title: e.target.value })} onBlur={(e) => saveTaskToDb(task.id, { title: e.target.value })}");
content = content.replace(/onChange=\{\(e\) => updateTask\(task\.id, \{ result_note: e\.target\.value \}\)\}/g, "onChange={(e) => updateLocalTask(task.id, { result_note: e.target.value })}");
content = content.replace(/onBlur=\{\(e\) => updateTask\(task\.id, \{ result_note: e\.target\.value \}\)\}/g, "onBlur={(e) => saveTaskToDb(task.id, { result_note: e.target.value })}");

// For selects and dates (which fire onChange when picking), we can use saveTaskToDb directly, or both.
// Actually, it's easier to just leave them as updateTask which we will redefine to do both.
const oldUpdateTask = /const updateTask = async \([\s\S]*?\n  \};/g;

// I'll just rewrite the whole file, it's safer.
