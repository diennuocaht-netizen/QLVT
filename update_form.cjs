const fs = require('fs');
const filename = 'src/pages/MeasurementForms.tsx';
let content = fs.readFileSync(filename, 'utf8');

const target = `<h5 className="text-sm font-medium text-gray-700 mb-2">Cấu hình tiêu đề cột:</h5>
                      <div className="space-y-2">`;

const replacement = `<h5 className="text-sm font-medium text-gray-700 mb-2">Cấu hình tiêu đề cột:</h5>
                      <div className="mb-3 flex items-center">
                        <input
                          type="checkbox"
                          id="isCombinedMode"
                          checked={formData.checklist_metadata?.isCombinedMode || false}
                          onChange={e => setFormData({ 
                            ...formData, 
                            checklist_metadata: { 
                              ...(formData.checklist_metadata || { customColumns: [] }), 
                              isCombinedMode: e.target.checked 
                            } 
                          })}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor="isCombinedMode" className="ml-2 block text-sm text-gray-900 font-medium">
                          Gộp chung kết quả kiểm tra (không chia theo từng thiết bị)
                        </label>
                      </div>
                      <div className="space-y-2">`;

content = content.replace(target, replacement);
fs.writeFileSync(filename, content, 'utf8');
console.log('Added isCombinedMode checkbox');
