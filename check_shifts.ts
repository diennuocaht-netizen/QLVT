import { supabase } from './src/supabase-client.ts';
async function run() {
  const { data } = await supabase.from('shift_types').select('*');
  console.log(JSON.stringify(data, null, 2));
}
run();
