const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Replace the event fetch
content = content.replace(
    /const \{ data: events \} = await supabase\s*\.from\('hr_events'\)\s*\.select\('id, title, progress, status, end_date'\)\s*\.eq\('status', 'in_progress'\)\s*\.order\('end_date', \{ ascending: true \}\)\s*\.limit\(3\);/,
    `const { data: events } = await supabase
      .from('hr_events')
      .select('id, title, progress, status, start_time, end_time')
      .in('status', ['ongoing', 'upcoming'])
      .order('start_time', { ascending: true })
      .limit(3);`
);

// Replace end_date display
content = content.replace(
    /\{new Date\(event\.end_date\)\.toLocaleDateString\('vi-VN'\)\}/g,
    `{event.start_time ? new Date(event.start_time).toLocaleDateString('vi-VN') : 'Chưa xếp lịch'}`
);

fs.writeFileSync('src/pages/Dashboard.tsx', content, 'utf8');
console.log('Fixed event fetch in Dashboard.tsx');
