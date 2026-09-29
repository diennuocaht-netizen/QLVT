import { supabase } from './src/supabase-client.ts';
async function run() {
  const { data: shiftTypes } = await supabase.from('shift_types').select('*').limit(1);
  if (!shiftTypes || shiftTypes.length === 0) { console.log('No shifts'); return; }
  const selectedShiftId = shiftTypes[0].id;

  const routines = [
    { title: 'Kiểm tra thông số tủ điện chính', priority: 'high' }
  ];
  
  const inserts = routines.map(r => ({
    title: r.title,
    description: 'Công việc định kỳ sinh tự động',
    date: '2026-09-29',
    shift_id: selectedShiftId,
    priority: r.priority,
    status: 'todo',
    created_by: null
  }));

  const { data, error } = await supabase.from('hr_shift_tasks').insert(inserts);
  if (error) {
    console.error("DB Error:", error.message);
  } else {
    console.log("Success");
  }
}
run();
