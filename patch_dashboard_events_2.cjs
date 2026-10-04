const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Replace the event fetch
content = content.replace(
    /const \{ data: events \} = await supabase\s*\.from\('hr_events'\)\s*\.select\('id, title, progress, status, start_time, end_time'\)\s*\.in\('status', \['ongoing', 'upcoming'\]\)\s*\.order\('start_time', \{ ascending: true \}\)\s*\.limit\(3\);/g,
    `const { data: eventsData, error: evError } = await supabase
      .from('hr_events')
      .select('id, title, status, start_time, end_time, hr_event_tasks(id, status)')
      .in('status', ['ongoing', 'upcoming'])
      .order('start_time', { ascending: true })
      .limit(3);

    let events = eventsData;
    if (eventsData) {
      events = eventsData.map(ev => {
        const tasks = ev.hr_event_tasks || [];
        const completedTasks = tasks.filter((t: any) => t.status === 'done').length;
        const progress = tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);
        return { ...ev, progress };
      });
    }`
);

fs.writeFileSync('src/pages/Dashboard.tsx', content, 'utf8');
console.log('Fixed event fetch in Dashboard.tsx to calculate progress');
