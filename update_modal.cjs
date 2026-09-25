const fs = require('fs');
const file = 'src/components/DeviceProfileModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add 'changelog' to activeTab state if needed (it's typed as string so any is fine)

// 2. Add the Tab button
const oldTabsEnd = `            <button
              className={\`py-3 px-4 font-medium text-sm border-b-2 \${activeTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}\`}
              onClick={() => setActiveTab('history')}
            >
              Lịch sử bảo dưỡng
            </button>
          </div>`;
          
const newTabsEnd = `            <button
              className={\`py-3 px-4 font-medium text-sm border-b-2 \${activeTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}\`}
              onClick={() => setActiveTab('history')}
            >
              Lịch sử bảo dưỡng
            </button>
            <button
              className={\`py-3 px-4 font-medium text-sm border-b-2 \${activeTab === 'changelog' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}\`}
              onClick={() => setActiveTab('changelog')}
            >
              Nhật ký thay đổi
            </button>
          </div>`;

content = content.replace(oldTabsEnd, newTabsEnd);

// 3. Add the Changelog Tab Content
// Look for the end of history tab content
const historyTabEndPattern = `                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};`;

// Let's find the position dynamically because history tab is complex.
// We can just append it before `</div>\n        </div>\n      </div>\n    </div>\n  );\n};`

const changelogTabContent = `
            {/* Changelog Tab */}
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

content = content.replace(
  `            )}
          </div>
        </div>
      </div>`,
  `            )}` + changelogTabContent + `          </div>\n        </div>\n      </div>`
);

fs.writeFileSync(file, content, 'utf8');
console.log('OK');
