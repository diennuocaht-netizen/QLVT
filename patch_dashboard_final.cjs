const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// 1. Add imports
content = content.replace(
    "import { supabase } from '../supabase-client';",
    "import { supabase } from '../supabase-client';\nimport { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';"
);

// 2. Add state
content = content.replace(
    "const [todayStaff, setTodayStaff] = useState<any[]>([]);",
    "const [todayStaff, setTodayStaff] = useState<any[]>([]);\n  const [chartData, setChartData] = useState<any[]>([]);"
);

// 3. Add fetchChart logic
const fetchChart = `
    // Fetch Chart Data
    const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const { data: cTasks } = await supabase
      .from('hr_shift_tasks')
      .select('status, subsystem:inventory_subsystems(name)')
      .gte('date', firstDay);
      
    if (cTasks) {
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
    }
`;
content = content.replace(
    "const fetchTodayData = async () => {\n    const today = new Date().toISOString().split('T')[0];",
    "const fetchTodayData = async () => {\n    const today = new Date().toISOString().split('T')[0];\n" + fetchChart
);

// 4. Update Event fetching logic
const oldEventFetch = /\/\/ Fetch Ongoing Events[\s\S]*?setOngoingEvents\(events \|\| \[\]\);/m;
const newEventFetch = `// Fetch Ongoing and Upcoming Events
    const { data: rawEvents } = await supabase
      .from('hr_events')
      .select('id, title, progress, status, end_date, start_date')
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
        setOngoingEvents(filteredEvents);
    }`;
content = content.replace(oldEventFetch, newEventFetch);

// 5. Insert Chart JSX right below OVERVIEW CARDS
// We will look for the end of the overview cards grid block.
// To be safe, we insert it right before `<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">`
const chartJsx = `        {/* CHART SECTION */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Thống kê công việc theo phân hệ (Tháng này)</h2>
          <div className="h-72 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
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
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Không có dữ liệu công việc trong tháng này.
              </div>
            )}
          </div>
        </div>\n`;
content = content.replace(
    '<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">',
    chartJsx + '\n      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">'
);

// 6. Update Event title
content = content.replace(
    'Sự kiện đang diễn ra',
    'Sự kiện đang & sắp diễn ra (5 ngày tới)'
);

fs.writeFileSync('src/pages/Dashboard.tsx', content, 'utf8');
console.log('Dashboard fully patched with Donut and Events, original layout preserved.');
