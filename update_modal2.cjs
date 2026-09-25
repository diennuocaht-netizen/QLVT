const fs = require('fs');
const file = 'src/components/DeviceProfileModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const tabRegex = /onClick=\{\(\) => setActiveTab\('history'\)\}[\s\S]*?L.ch s. b.o d..ng[\s\S]*?<\/button>[\s\S]*?<\/div>/m;
const match = content.match(tabRegex);
if (match) {
  content = content.replace(tabRegex, match[0].replace('</div>', `
            <button
              className={\`py-3 px-4 font-medium text-sm border-b-2 \${activeTab === 'changelog' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}\`}
              onClick={() => setActiveTab('changelog')}
            >
              Nhật ký thay đổi
            </button>
          </div>`));
  console.log('Tabs updated');
} else {
  console.log('Tabs regex failed');
}

const contentRegex = /\{\/\* Lịch sử bảo dưỡng \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\)\}\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\};/m;
// Wait, replacing the end of file might be easier by just finding the last `</div>` blocks.
const lastParts = content.lastIndexOf('</div>\n        </div>\n      </div>\n    </div>\n  );\n};');
if (lastParts !== -1) {
  const changelogTabContent = `
            {/* Changelog Tab */}
            {activeTab === 'changelog' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mt-6">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <h3 className="text-md font-semibold text-gray-800">Nhật ký thay đổi thiết bị (Logfile)</h3>
                </div>
                <div className="p-0">
                  {(!device?.change_logs || device.change_logs.length === 0) ? (
                    <div className="p-8 text-center text-gray-500 bg-gray-50">
                      Chưa có lịch sử thay đổi nào được ghi nhận.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                      {[...(device.change_logs)].reverse().map((log: any, idx: number) => (
                        <div key={idx} className="p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start mb-1">
                            <div className="font-semibold text-gray-800 flex items-center">
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded mr-2">{log.action || 'Cập nhật'}</span>
                              {log.user || 'Hệ thống'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(log.timestamp).toLocaleString('vi-VN')}
                            </div>
                          </div>
                          <div className="text-sm text-gray-600 mt-2 bg-gray-50 p-3 rounded border border-gray-100 break-words whitespace-pre-wrap">
                            {log.details || 'Không có chi tiết'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
`;
  content = content.substring(0, lastParts) + changelogTabContent + content.substring(lastParts);
  console.log('Content updated');
} else {
  console.log('Content index failed');
}

fs.writeFileSync(file, content, 'utf8');
