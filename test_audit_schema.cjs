const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && !key.startsWith('#')) acc[key.trim()] = val.join('=').trim();
  return acc;
}, {});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function test() {
    const { data, error } = await supabase.from('inventory_audits').select('*').limit(1);
    console.log("Audits Error:", error);
    const { data: d2, error: e2 } = await supabase.from('inventory_audit_items').select('*').limit(1);
    console.log("Audit Items Error:", e2);
}
test();
