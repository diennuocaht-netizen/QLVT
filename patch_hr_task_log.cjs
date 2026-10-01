const fs = require('fs');
let content = fs.readFileSync('src/pages/HRTaskLog.tsx', 'utf8');

// Replace table headers
content = content.replace(
  /<thead[\s\S]*?<\/thead>/m,
  `<thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Công việc & Phân hệ</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giao việc<br/>(Người / Thời gian)</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nội dung yêu cầu</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phụ trách<br/>(Assignee)</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hoàn thành<br/>(Người / Thời gian)</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kết quả xử lý</th>
              </tr>
            </thead>`
);

// Replace colSpan=5 with colSpan=6
content = content.replace(/colSpan=\{5\}/g, "colSpan={6}");

// Replace table cells mapping
const oldTbodyContentRegex = /<td className="px-6 py-4">[\s\S]*?<\/tr>/m;
const newTbodyContent = `<td className="px-4 py-4 align-top">
                      <div className="font-bold text-sm text-gray-900">{log.title}</div>
                      <div className="mt-1 flex items-center text-xs text-teal-700 bg-teal-50 border border-teal-100 rounded px-1.5 py-0.5 w-max">
                        <Layers className="w-3 h-3 mr-1" />
                        {log.subsystem_name}
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top text-sm">
                      <div className="text-gray-900 font-medium whitespace-nowrap"><User className="w-3 h-3 inline mr-1 text-gray-400"/>{log.assigner}</div>
                      <div className="text-gray-500 text-xs mt-1 whitespace-nowrap">{new Date(log.assigned_at).toLocaleString('vi-VN')}</div>
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-gray-600 max-w-xs" title={log.original_description}>
                      <div className="line-clamp-3 whitespace-pre-wrap">{log.original_description || '-'}</div>
                    </td>
                    <td className="px-4 py-4 align-top text-sm">
                      <div className="text-gray-900 font-medium whitespace-nowrap"><User className="w-3 h-3 inline mr-1 text-blue-400"/>{log.assignee}</div>
                    </td>
                    <td className="px-4 py-4 align-top text-sm">
                      <div className="flex flex-col gap-1 mb-1">
                        {log.completers.map((name: string, i: number) => (
                          <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded bg-green-50 text-green-700 text-[11px] font-medium border border-green-100 whitespace-nowrap w-max">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {name}
                          </span>
                        ))}
                      </div>
                      <div className="text-gray-500 text-xs whitespace-nowrap">{new Date(log.completed_at).toLocaleString('vi-VN')}</div>
                    </td>
                    <td className="px-4 py-4 align-top text-sm text-gray-600 min-w-[200px] whitespace-pre-wrap">
                      {log.completion_note || '-'}
                    </td>
                  </tr>`;

content = content.replace(oldTbodyContentRegex, newTbodyContent);

fs.writeFileSync('src/pages/HRTaskLog.tsx', content, 'utf8');
console.log('HRTaskLog.tsx updated');
