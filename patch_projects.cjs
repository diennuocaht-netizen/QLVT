const fs = require('fs');
const file = 'src/pages/Projects.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldCode = `<Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span>HoAn thAnh: {project.completion_date}</span>`;

const newCode = `<Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span>Bắt đầu: {project.start_date || '--'}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        <span>Hoàn thành: {project.completion_date}</span>`;

// Use regex to avoid encoding mismatch
const regex = /<Calendar className="w-4 h-4 mr-2 text-gray-400" \/>\s*<span>Ho[\s\S]*?\{project\.completion_date\}<\/span>/;
content = content.replace(regex, `<Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          <span>Bắt đầu: {project.start_date || '--'}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          <span>Kết thúc: {project.completion_date}</span>`);

// Add progress bar right before warranty
const warrantyRegex = /<div className="flex items-center">\s*<ShieldAlert className=\{/m;

// Calculate progress average
const progressCalc = `
                        {(() => {
                          const tasks = project.tasks || [];
                          if (tasks.length === 0) return null;
                          const avg = Math.round(tasks.reduce((sum: number, t: any) => sum + (t.progress || 0), 0) / tasks.length);
                          return (
                            <div className="mt-2 pt-2 border-t border-gray-100">
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
