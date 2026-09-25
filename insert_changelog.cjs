const fs = require('fs');
const file = 'src/components/DeviceProfileModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Insert Tab Button
const tabButtonTarget = `onClick={() => setActiveTab('history')}
            >
              Lịch sử bảo dưỡng
            </button>`;

if (content.indexOf(tabButtonTarget) !== -1) {
  content = content.replace(tabButtonTarget, `onClick={() => setActiveTab('history')}
            >
              Lịch sử bảo dưỡng
            </button>
            <button
              className={\`py-3 px-4 font-medium text-sm border-b-2 \${activeTab === 'changelog' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}\`}
              onClick={() => setActiveTab('changelog')}
            >
              Logfile (Thay đổi)
            </button>`);
  console.log('Tab button added');
} else {
  // Try fallback search
  const tabButtonTarget2 = `onClick={() => setActiveTab('history')}`;
  const idx = content.indexOf(tabButtonTarget2);
  const endButtonIdx = content.indexOf('</button>', idx) + 9;
  if (idx !== -1) {
    const replacement = content.substring(idx, endButtonIdx) + `
            <button
              className={\`py-3 px-4 font-medium text-sm border-b-2 \${activeTab === 'changelog' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}\`}
              onClick={() => setActiveTab('changelog')}
            >
              Logfile (Thay đổi)
            </button>`;
    content = content.substring(0, idx) + replacement + content.substring(endButtonIdx);
    console.log('Tab button added via fallback');
  } else {
    console.log('Tab button NOT FOUND');
  }
}

// 2. Insert Tab Content
const footerIdx = content.indexOf('{/* Footer */}');
if (footerIdx !== -1) {
  const changelogTabContent = `
          {activeTab === 'changelog' && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
        
  content = content.substring(0, footerIdx) + changelogTabContent + '\n        ' + content.substring(footerIdx);
  console.log('Tab content added');
} else {
  console.log('Footer NOT FOUND');
}

fs.writeFileSync(file, content, 'utf8');
