const fs = require('fs');
let content = fs.readFileSync('src/pages/InventorySettings.tsx', 'utf8');

const tabButton = `          <button
            className={\`px-6 py-3 text-sm font-medium \${activeTab === 'auditTemplates' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500 hover:text-gray-700'}\`}
            onClick={() => setActiveTab('auditTemplates')}
          >
            DS Kiểm kê mẫu
          </button>`;

if (!content.includes('DS Kiểm kê mẫu</button>')) {
  content = content.replace(
    /Quản lý Folder Google Drive\s*<\/button>\s*<\/div>/,
    "Quản lý Folder Google Drive\n          </button>\n" + tabButton + "\n        </div>"
  );
  fs.writeFileSync('src/pages/InventorySettings.tsx', content, 'utf8');
}

console.log('Added Tab Button');
