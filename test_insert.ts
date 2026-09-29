import { supabase } from './src/supabase-client.ts';
async function run() {
  const payload = {
    title: 'Test Task',
    date: '2026-09-29',
    shift_id: null,
    assignee_id: "",
    priority: 'medium',
    status: 'todo'
  };
  const { data, error } = await supabase.from('hr_shift_tasks').insert([payload]).select();
  if (error) {
    console.error("Insert Error:", error.message);
  } else {
    console.log("Inserted:", data);
  }
}
run();
