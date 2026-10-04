const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && !key.startsWith('#')) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function test() {
    const itemIds = ['708c516f-78b1-4088-82ea-ebc4636c9cb7', 'c58eeb4c-8484-464e-b0f0-9b5889aaa6c8'];
    const { data, error } = await supabase.from('inventory_items').select('*').in('id', itemIds);
    console.log("Error:", error);
    console.log("Data length:", data ? data.length : 0);
    if (data && data.length > 0) {
        console.log("First item:", data[0].id, data[0].name);
    }
}
test();
