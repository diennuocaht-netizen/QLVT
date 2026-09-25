const fs = require('fs');
const file = 'src/components/devices/EquipmentDetailsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Insert Tab Button
const tabButtonTarget = `onClick={() => setActiveTab('documents')}
          >
            <FileText className="w-4 h-4 mr-2" /> Tài liệu kỹ thuật
          </button>`;
// Since encoding might be weird, use regex
const btnRegex = /onClick=\{\(\) => setActiveTab\('documents'\)\}[\s\S]*?<\/button>/m;
const match = content.match(btnRegex);
if (match) {
  content = content.replace(btnRegex, match[0] + `
          <button
            onClick={() => setActiveTab('changelog')}
            className={\`py-4 px-6 text-sm font-medium border-b-2 flex items-center \${activeTab === 'changelog' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}\`}
          >
            <FileText className="w-4 h-4 mr-2" /> Nhật ký thay đổi (Logfile)
          </button>`);
  console.log('Tab button added');
} else {
  console.log('Tab button NOT FOUND');
}

// 2. Fetch logs from activity_logs when changelog tab is active
// We need state for logs
const stateTarget = `const [documents, setDocuments] = useState<any[]>([]);`;
if (content.indexOf(stateTarget) !== -1) {
  content = content.replace(stateTarget, stateTarget + `\n  const [activityLogs, setActivityLogs] = useState<any[]>([]);\n  const [loadingLogs, setLoadingLogs] = useState(false);`);
  console.log('State added');
}

// Effect target
const effectTarget = `} else if (activeTab === 'documents') {
      fetchDocuments();
    }`;
if (content.indexOf(effectTarget) !== -1) {
  const fetchLogsFunc = `
  const fetchActivityLogs = async () => {
    setLoadingLogs(true);
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .eq('entity_type', 'measured_equipment')
        .eq('entity_id', equipment.id)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setActivityLogs(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };`;
  
  content = content.replace(effectTarget, effectTarget + ` else if (activeTab === 'changelog') {\n      fetchActivityLogs();\n    }`);
  
  // Insert fetchActivityLogs before the useEffect
  const useEffectIdx = content.indexOf('useEffect(() => {');
  content = content.substring(0, useEffectIdx) + fetchLogsFunc + '\n\n  ' + content.substring(useEffectIdx);
  console.log('Fetch added');
}

// 3. Insert Tab Content
const endModalRegex = /\{\/\* END MODAL CONTENT \*\/\}|<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\};/m;
const lastDivIdx = content.lastIndexOf('</div>\n      </div>\n    </div>\n  );\n};');

if (lastDivIdx !== -1) {
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
          )}
        `;
        
  content = content.substring(0, lastDivIdx) + changelogTabContent + '\n      ' + content.substring(lastDivIdx);
  console.log('Tab content added');
} else {
  console.log('End of modal NOT FOUND');
}

fs.writeFileSync(file, content, 'utf8');
