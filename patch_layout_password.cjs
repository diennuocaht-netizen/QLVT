const fs = require('fs');
let content = fs.readFileSync('src/components/Layout.tsx', 'utf8');

if (!content.includes('ChangePasswordModal')) {
    content = content.replace(
        "import { useAuth } from '../contexts/AuthContext';",
        "import { useAuth } from '../contexts/AuthContext';\nimport { ChangePasswordModal } from './ChangePasswordModal';"
    );
    
    // Add Key to lucide-react import
    if (!content.includes('Key,')) {
        content = content.replace(
            "import { ",
            "import { Key, "
        );
    }
    
    // Add state
    content = content.replace(
        "const { profile, logout } = useAuth();",
        "const { profile, logout } = useAuth();\n  const [showChangePassword, setShowChangePassword] = useState(false);"
    );
    
    // Add button
    const btnHtml = `
          <button
            onClick={() => setShowChangePassword(true)}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors mb-2"
          >
            <Key className="mr-3 h-5 w-5 text-gray-500" />
            Đổi mật khẩu
          </button>
          <button`;
    content = content.replace(
        '<button\n            onClick={logout}',
        btnHtml
    );
    
    // Add Modal at the end inside the main wrapper
    content = content.replace(
        '    </div>\n  );\n};',
        '      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}\n    </div>\n  );\n};'
    );
    
    fs.writeFileSync('src/components/Layout.tsx', content, 'utf8');
    console.log('Layout patched for ChangePassword');
}
