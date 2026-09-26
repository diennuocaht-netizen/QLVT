const fs = require('fs');
const file = 'src/components/projects/ProjectForm.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `                <div>
                  <label className="block text-sm font-medium text-gray-700">NgAy hoAn thAnh *</label>
                  <input
                    type="date"
                    {...register('completion_date')}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {errors.completion_date && <p className="mt-1 text-xs text-red-600">{errors.completion_date.message}</p>}
                </div>`;

const replaceIdx = content.indexOf(`{...register('completion_date')}`);
if (replaceIdx !== -1) {
  // Find start of div
  const startDiv = content.lastIndexOf('<div', replaceIdx);
  // Find end of div
  const endDiv = content.indexOf('</div>', replaceIdx) + 6;
  
  const replacement = `
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ngày bắt đầu</label>
                    <input
                      type="date"
                      {...register('start_date')}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ngày kết thúc *</label>
                    <input
                      type="date"
                      {...register('completion_date')}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    {errors.completion_date && <p className="mt-1 text-xs text-red-600">{errors.completion_date.message}</p>}
                  </div>
                </div>
  `;
  content = content.substring(0, startDiv) + replacement + content.substring(endDiv);
  fs.writeFileSync(file, content, 'utf8');
  console.log('UI updated');
}
