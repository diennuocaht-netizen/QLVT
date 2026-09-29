import { supabase } from './src/supabase-client.ts';
async function run() {
  const { data: p } = await supabase.from('profiles').select('*').limit(1);
  const { data: e } = await supabase.from('shift_employees').select('*').limit(1);
  console.log("Profiles:", p ? "exists" : "none");
  console.log("Employees:", e ? "exists" : "none");
}
run();
