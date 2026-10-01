const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// 1. Add imports
if (!content.includes('BarChart')) {
    content = content.replace(
        "import { supabase } from '../supabase-client';",
        "import { supabase } from '../supabase-client';\nimport { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';"
    );
}

// 2. Add state
if (!content.includes('const [chartData')) {
    content = content.replace(
        "const [todayStaff, setTodayStaff] = useState<any[]>([]);",
        "const [todayStaff, setTodayStaff] = useState<any[]>([]);\n  const [chartData, setChartData] = useState<any[]>([]);"
    );
}

// 3. Add fetch logic inside fetchStats or fetchTodayData
const fetchLogic = `
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
              if (!grouped[ss]) grouped[ss] = { name: ss, done: 0, in_progress: 0 };
              if (t.status === 'done') {
                  grouped[ss].done += 1;
              } else {
                  grouped[ss].in_progress += 1;
              }
          });
          setChartData(Object.values(grouped));
      }
`;

if (!content.includes('cTasks.forEach')) {
    content = content.replace(
        "const today = new Date().toISOString().split('T')[0];",
        "const today = new Date().toISOString().split('T')[0];\n" + fetchLogic
    );
}

// 4. Inject JSX
const chartJsx = `
        {/* CHART SECTION */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Thống kê công việc theo phân hệ (Tháng này)</h2>
          <div className="h-72 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{fontSize: 12}} tickLine={false} axisLine={{stroke: '#E5E7EB'}} />
                  <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={{stroke: '#E5E7EB'}} />
                  <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                    cursor={{fill: '#F3F4F6'}}
                  />
                  <Legend wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                  <Bar dataKey="done" name="Đã hoàn thành" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} barSize={40} />
                  <Bar dataKey="in_progress" name="Đang làm / Chưa làm" stackId="a" fill="#FBBF24" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Không có dữ liệu công việc trong tháng này.
              </div>
            )}
          </div>
        </div>
`;

if (!content.includes('CHART SECTION')) {
    content = content.replace(
        "{/* OVERVIEW CARDS */}",
        chartJsx + "\n\n        {/* OVERVIEW CARDS */}"
    );
}

fs.writeFileSync('src/pages/Dashboard.tsx', content, 'utf8');
console.log('Dashboard patched with Chart');
