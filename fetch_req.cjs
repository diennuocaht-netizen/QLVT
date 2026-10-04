const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && !key.startsWith('#')) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function test() {
    const { data, error } = await supabase.from('inventory_requisitions').select('*').eq('code', '29-ĐNCT/PKT').single();
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Items JSON:", JSON.stringify(data.items, null, 2));
    }
}
test();
