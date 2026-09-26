import { supabase } from './src/supabase-client';

async function test() {
  const { data, error } = await supabase.from('inventory_items').select('id, code');
  console.log('Error:', error);
  console.log('Data count:', data ? data.length : 0);
}
test();
