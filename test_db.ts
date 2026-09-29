import { supabase } from './src/supabase-client.ts';
async function run() {
  const { data, error } = await supabase.from('hr_shift_tasks').select('*').limit(1);
  if (error) {
    console.error("DB Error:", error.message);
  } else {
    console.log("Table exists, rows:", data.length);
  }
}
run();
