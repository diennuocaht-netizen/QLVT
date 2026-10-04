const fs = require('fs');
let content = fs.readFileSync('src/pages/Devices.tsx', 'utf8');

// 1. Add import CheckCircle
content = content.replace(
    /import \{ Plus, Search, Server, Edit, Trash2, Upload, Eye, Zap, X \} from 'lucide-react';/,
    `import { Plus, Search, Server, Edit, Trash2, Upload, Eye, Zap, X, CheckCircle, CheckCircle2 } from 'lucide-react';
import { VerifyDevicesModal } from '../components/VerifyDevicesModal';`
);

// 2. Add state
content = content.replace(
    /const \[siblingModalDevices, setSiblingModalDevices\] = useState<any\[\]>\(\[\]\);/,
    `const [siblingModalDevices, setSiblingModalDevices] = useState<any[]>([]);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);`
);

// 3. Add verify button to header
content = content.replace(
    /<button onClick=\{\(\) => setIsFormOpen\(true\)\} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2">/,
    `<button onClick={() => setIsVerifyModalOpen(true)} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 shadow-sm font-medium">
            <CheckCircle className="w-4 h-4" /> Xác nhận đã kiểm tra
          </button>
          <button onClick={() => setIsFormOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center gap-2">`
);

// 4. Render Verification Badge in table
content = content.replace(
    /<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">\{device\.code\}<\/td>/,
    `<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        {device.code}
                        {device.last_verified_at && new Date().getTime() - new Date(device.last_verified_at).getTime() < 30 * 24 * 60 * 60 * 1000 && (
                          <span title={\`Đã kiểm tra lúc \${new Date(device.last_verified_at).toLocaleString('vi-VN')}\`} className="text-green-500 flex items-center justify-center bg-green-50 rounded-full w-5 h-5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>`
);

// 5. Render Modal
content = content.replace(
    /<\/div>\s*<\/div>\s*\)$/,
    `
        <VerifyDevicesModal
          isOpen={isVerifyModalOpen}
          onClose={() => setIsVerifyModalOpen(false)}
          devices={devices}
          onVerified={() => {
            fetchDevices();
          }}
        />
      </div>
    </div>
  );`
);

fs.writeFileSync('src/pages/Devices.tsx', content, 'utf8');
console.log('Patched Devices.tsx with VerifyDevicesModal');
