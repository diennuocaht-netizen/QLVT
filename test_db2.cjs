require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://setljfuhprinmsqztqyd.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('hr_shift_tasks').select('*').limit(1);
  if (error) {
    console.error("Error:", error.message, error.code);
  } else {
    console.log("Table exists, row count:", data.length);
  }
}
run();
