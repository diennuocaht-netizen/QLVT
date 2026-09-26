const fs = require('fs');
const file = 'src/pages/Projects.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /<Calendar className="w-4 h-4 mr-2 text-gray-400" \/>\s*<span>.*\{project\.completion_date\}<\/span>/;
const match = content.match(regex);
console.log(match ? "Matched completion date UI" : "Did not match completion date UI");

if (match && !content.includes('project.start_date')) {
  content = content.replace(regex, `<Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          <span>Bắt đầu: {project.start_date || '--'}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          <span>Kết thúc: {project.completion_date}</span>`);
  
  const warrantyRegex = /<div className="flex items-center">\s*<ShieldAlert className=\{/m;
  const progressCalc = `
                        {(() => {
                          const tasks = project.tasks || [];
                          if (tasks.length === 0) return null;
                          const avg = Math.round(tasks.reduce((sum: number, t: any) => sum + (t.progress || 0), 0) / tasks.length);
                          return (
                            <div className="mt-2 pt-2 border-t border-gray-100 w-full">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-medium text-gray-500">Tiến độ tổng ({tasks.length} hạng mục)</span>
                                <span className="text-xs font-bold text-indigo-600">{avg}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: \`\${avg}%\` }}></div>
                              </div>
                            </div>
                          );
                        })()}
                        `;
  content = content.replace(warrantyRegex, progressCalc + '\n                        <div className="flex items-center">\n                          <ShieldAlert className={');
  fs.writeFileSync(file, content, 'utf8');
  console.log('OK patched Projects.tsx');
}
