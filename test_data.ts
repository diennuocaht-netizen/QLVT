import { supabase } from './src/supabase-client.ts';
async function test() {
  const { data, error } = await supabase.from('shift_assignments').select('*, employee:shift_employees(id, full_name, role), shift:shift_types(id, code, name)').eq('date', new Date().toISOString().split('T')[0]);
  console.log(JSON.stringify(data, null, 2));
}
test();
