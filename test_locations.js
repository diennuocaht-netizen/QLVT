import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://setljfuhprinmsqztqyd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNldGxqZnVocHJpbm1zcXp0cXlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NjU1OTQsImV4cCI6MjA5MDA0MTU5NH0.G-9i8kycOc8e8ic_tU21sCeL5YQ1R73hkmkS19wWrAM';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('inventory_locations').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Data:', data);
  }
}

test();
