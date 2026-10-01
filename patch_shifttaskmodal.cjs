const fs = require('fs');
const file = 'src/components/hr/ShiftTaskModal.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add state for subsystems
if (!content.includes('const [subsystems, setSubsystems] = useState')) {
  content = content.replace(
    'const [shiftTypes, setShiftTypes] = useState<any[]>([]);',
    "const [shiftTypes, setShiftTypes] = useState<any[]>([]);\n  const [subsystems, setSubsystems] = useState<any[]>([]);"
  );
}

// 2. Add subsystem_id to formData
if (!content.includes('subsystem_id: task?.subsystem_id')) {
  content = content.replace(
    "status: task?.status || 'todo'",
    "status: task?.status || 'todo',\n    subsystem_id: task?.subsystem_id || ''"
  );
}

// 3. Import Layers icon
if (!content.includes('Layers')) {
  content = content.replace(
    "AlertCircle, FileText } from 'lucide-react'",
    "AlertCircle, FileText, Layers } from 'lucide-react'"
  );
}

// 4. Fetch subsystems in useEffect
const useEffectRegex = /(const fetchDependencies = async \(\) => \{[\s\S]*?const \[usersRes, shiftsRes\] = await Promise\.all\(\[[\s\S]*?\]\);)/;
const newDependencies = `const fetchDependencies = async () => {
      try {
        const [usersRes, shiftsRes, subsystemsRes] = await Promise.all([
          supabase.from('users').select('id, display_name, email').order('display_name'),
          supabase.from('shift_types').select('id, name').order('name'),
          supabase.from('inventory_subsystems').select('id, name').order('name')
        ]);
        if (usersRes.data) setUsers(usersRes.data);
        if (shiftsRes.data) setShiftTypes(shiftsRes.data);
        if (subsystemsRes.data) setSubsystems(subsystemsRes.data);
      } catch (err) {
        console.error(err);
      }
    };`;
// Replace the old fetch block
const fullUseEffectBlockRegex = /const fetchDependencies = async \(\) => \{[\s\S]*?\}\s*catch \(err\) \{\s*console\.error\(err\);\s*\}\s*\};/m;
content = content.replace(fullUseEffectBlockRegex, newDependencies);


// 5. Add UI field
const uiField = `          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Phân hệ</label>
            <div className="relative">
              <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={formData.subsystem_id}
                onChange={(e) => setFormData({ ...formData, subsystem_id: e.target.value })}
                className="w-full pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none"
              >
                <option value="">-- Thuộc phân hệ (Tùy chọn) --</option>
                {subsystems.map(ss => (
                  <option key={ss.id} value={ss.id}>{ss.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">`;

content = content.replace('<div className="grid grid-cols-2 gap-4">', uiField);

fs.writeFileSync(file, content, 'utf8');
console.log('Patched ShiftTaskModal.tsx');
