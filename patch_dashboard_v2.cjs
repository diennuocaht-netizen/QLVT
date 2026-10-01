const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// 1. Change Imports
content = content.replace(
    /import \{ BarChart[\s\S]*?\} from 'recharts';/,
    "import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';"
);

// 2. Change Chart Data calculation to include 'total'
const oldFetchChart = /if \(cTasks\) \{[\s\S]*?setChartData\(Object\.values\(grouped\)\);\s*\}/;
const newFetchChart = `if (cTasks) {
          const grouped: Record<string, any> = {};
          cTasks.forEach(t => {
              const ss = (t.subsystem as any)?.name || 'Chưa phân loại';
              if (!grouped[ss]) grouped[ss] = { name: ss, done: 0, in_progress: 0, total: 0 };
              if (t.status === 'done') {
                  grouped[ss].done += 1;
              } else {
                  grouped[ss].in_progress += 1;
              }
              grouped[ss].total += 1;
          });
          setChartData(Object.values(grouped));
      }`;
content = content.replace(oldFetchChart, newFetchChart);

// 3. Replace BarChart JSX with PieChart JSX
const oldChartJsx = /<BarChart[\s\S]*?<\/BarChart>/;
const newChartJsx = `<PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="total"
                  >
                    {chartData.map((entry, index) => {
                      const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8B5CF6', '#F43F5E', '#10B981', '#F59E0B'];
                      return <Cell key={\`cell-\${index}\`} fill={COLORS[index % COLORS.length]} />;
                    })}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name, props) => {
                      return [\`\${value} việc (Xong: \${props.payload.done}, Đang làm/Chưa làm: \${props.payload.in_progress})\`, props.payload.name];
                    }}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                  />
                  <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{fontSize: '11px', paddingTop: '10px'}} />
                </PieChart>`;
content = content.replace(oldChartJsx, newChartJsx);

// 4. Update Event fetching logic
const oldEventFetch = /\/\/ Fetch Ongoing Events[\s\S]*?setTodayEvents\(events \|\| \[\]\);/;
const newEventFetch = `// Fetch Ongoing and Upcoming Events
      const { data: rawEvents } = await supabase
        .from('hr_events')
        .select('id, title, progress, status, start_date, end_date')
        .in('status', ['in_progress', 'upcoming'])
        .order('start_date', { ascending: true });
        
      if (rawEvents) {
          const now = new Date();
          const next5 = new Date();
          next5.setDate(now.getDate() + 5);
          
          const filteredEvents = rawEvents.filter(e => {
              if (e.status === 'in_progress') return true;
              if (e.start_date) {
                  const sd = new Date(e.start_date);
                  return sd <= next5;
              }
              return false;
          }).slice(0, 5);
          
          setTodayEvents(filteredEvents);
      }`;
content = content.replace(oldEventFetch, newEventFetch);

// Update event list header to reflect the new logic
content = content.replace(
    /<h2 className="text-lg font-bold text-gray-900 mb-4">Sự kiện đang diễn ra<\/h2>/,
    '<h2 className="text-lg font-bold text-gray-900 mb-4">Sự kiện đang & sắp diễn ra (5 ngày tới)</h2>'
);

fs.writeFileSync('src/pages/Dashboard.tsx', content, 'utf8');
console.log('Dashboard patched with Donut Chart and Event Logic');
