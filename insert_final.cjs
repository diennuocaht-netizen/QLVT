const fs = require('fs');
const file = 'src/components/devices/EquipmentDetailsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetRegex = /<\/div>\s*<\/div>\s*\)\)\}\s*<\/div>\s*\)\}\s*<\/div>\s*\)\}/m;
const match = content.match(targetRegex);
if (match) {
  const changelogTabContent = `
          {activeTab === 'changelog' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Nhật ký thay đổi thiết bị (Logfile)</h3>
              {loadingLogs ? (
                <div className="flex justify-center p-8"><div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>
              ) : activityLogs.length === 0 ? (
                <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  Chưa có lịch sử thay đổi nào được ghi nhận.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto pr-2">
                  {activityLogs.map((log: any) => (
                    <div key={log.id} className="py-4 hover:bg-gray-50 transition-colors px-2 rounded-md">
                      <div className="flex justify-between items-start mb-1">
                        <div className="font-semibold text-gray-800 flex items-center">
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded mr-2">{log.action || 'Cập nhật'}</span>
                          {log.user_name || 'Hệ thống'}
                        </div>
                        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {new Date(log.created_at).toLocaleString('vi-VN')}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mt-2 bg-white p-3 rounded border border-gray-200 break-words whitespace-pre-wrap shadow-sm">
                        {log.details ? (
                          typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : log.details
                        ) : 'Không có chi tiết'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}`;
          
  content = content.replace(targetRegex, match[0] + '\n' + changelogTabContent);
  console.log('Changelog content added successfully');
} else {
  console.log('Could not find the insertion point');
}

fs.writeFileSync(file, content, 'utf8');
