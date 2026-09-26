import { supabase } from './src/supabase-client';

async function checkProjects() {
  const { data, error } = await supabase.from('projects').select('*').limit(1);
  console.log(data);
  console.log(error);
}
checkProjects();
