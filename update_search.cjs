const fs = require('fs');

const filename = 'src/components/devices/MeasurementSessionModal.tsx';
let content = fs.readFileSync(filename, 'utf8');

// 1. Add state
const statePattern = /const \[selectedEquipmentIds, setSelectedEquipmentIds\] = useState<string\[\]>\(\[\]\);/;
content = content.replace(statePattern, `const [selectedEquipmentIds, setSelectedEquipmentIds] = useState<string[]>([]);
  const [searchEqTerm, setSearchEqTerm] = useState('');`);

// 2. Add filteredAvailableEquipments and update handleSelectAllEq
const handleSelectAllEqPattern = /const handleSelectAllEq = \(\) => \{[\s\S]*?\};/;
const newHandleSelectAllEq = `const filteredAvailableEquipments = availableEquipments.filter(eq => 
    eq.name.toLowerCase().includes(searchEqTerm.toLowerCase()) || 
    eq.code.toLowerCase().includes(searchEqTerm.toLowerCase()) || 
    (eq.location && eq.location.toLowerCase().includes(searchEqTerm.toLowerCase()))
  );

  const handleSelectAllEq = () => {
    const filteredIds = filteredAvailableEquipments.map(e => e.id);
    const allFilteredSelected = filteredIds.length > 0 && filteredIds.every(id => selectedEquipmentIds.includes(id));
    
    if (allFilteredSelected) {
      // Deselect all filtered items
      setSelectedEquipmentIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      // Select all filtered items (merge with currently selected)
      setSelectedEquipmentIds(prev => {
        const set = new Set([...prev, ...filteredIds]);
        return Array.from(set);
      });
    }
  };`;
content = content.replace(handleSelectAllEqPattern, newHandleSelectAllEq);

// 3. Update the JSX to add the search input and use filtered array
// It looks like:
/*
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-700">Thiết bị/Máy móc cần kiểm tra <span className="text-red-500">*</span></label>
                  {!isViewOnly && (
                    <button type="button" onClick={handleSelectAllEq} className="text-xs text-indigo-600 hover:underline">
                      {selectedEquipmentIds.length === availableEquipments.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    </button>
                  )}
                </div>
                <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto bg-white divide-y divide-gray-100">
                  {availableEquipments.map(eq => (
*/
const jsxTarget = `<div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-700">Thiết bị/Máy móc cần kiểm tra <span className="text-red-500">*</span></label>
                  {!isViewOnly && (
                    <button type="button" onClick={handleSelectAllEq} className="text-xs text-indigo-600 hover:underline">
                      {filteredAvailableEquipments.length > 0 && filteredAvailableEquipments.every(eq => selectedEquipmentIds.includes(eq.id)) ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    </button>
                  )}
                </div>
                {!isViewOnly && (
                  <div className="mb-2 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="Tìm kiếm máy móc, thiết bị..."
                      value={searchEqTerm}
                      onChange={(e) => setSearchEqTerm(e.target.value)}
                    />
                  </div>
                )}
                <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto bg-white divide-y divide-gray-100">
                  {filteredAvailableEquipments.map(eq => (`;

content = content.replace(/<div className="flex justify-between items-center mb-2">[\s\S]*?\{availableEquipments\.map\(eq => \(/, jsxTarget);

content = content.replace(/\{availableEquipments\.length === 0 && \(/g, '{filteredAvailableEquipments.length === 0 && (');

fs.writeFileSync(filename, content, 'utf8');
console.log('Added search to MeasurementSessionModal');
