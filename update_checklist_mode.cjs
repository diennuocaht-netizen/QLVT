const fs = require('fs');
const filename = 'src/components/devices/MeasurementSessionModal.tsx';
let content = fs.readFileSync(filename, 'utf8');

// 1. Add equipmentColumnsForChecklist logic
content = content.replace(
  /<table className="w-full border-collapse text-sm min-w-max">\s*<thead>/g,
  `{(() => {
    const equipmentColumnsForChecklist = selectedForm?.checklist_metadata?.isCombinedMode ? ['combined'] : selectedEquipmentIds;
    return (
      <table className="w-full border-collapse text-sm min-w-max">
        <thead>`
);

// 2. Fix header mapping
content = content.replace(
  /selectedEquipmentIds\.map\(eqId => \{\s*const eq = availableEquipments\.find\(e => e\.id === eqId\);\s*return \(\s*<th key=\{eqId\} className="border border-gray-300 p-2 text-center bg-indigo-50 min-w-\[200px\]">\s*<div className="font-bold text-indigo-900">\{eq\?\.name\}<\/div>\s*<\/th>\s*\);\s*\}\)/g,
  `equipmentColumnsForChecklist.map(eqId => {
    const eqName = eqId === 'combined' ? 'Kết quả chung' : availableEquipments.find(e => e.id === eqId)?.name;
    return (
      <th key={eqId} className="border border-gray-300 p-2 text-center bg-indigo-50 min-w-[200px]">
        <div className="font-bold text-indigo-900">{eqName}</div>
      </th>
    );
  })`
);

// 3. Fix eqColsCount calculation
content = content.replace(
  /const eqColsCount = \(isViewOnly && Object\.keys\(legacyChecklist\)\.length > 0\) \? 1 : selectedEquipmentIds\.length;/g,
  `const eqColsCount = (isViewOnly && Object.keys(legacyChecklist).length > 0) ? 1 : equipmentColumnsForChecklist.length;`
);

// 4. Fix row mapping
content = content.replace(
  /selectedEquipmentIds\.map\(eqId => \{\s*const val = checklistByEquipment\[eqId\]\?\.\[item\.id\]\?\.status;\s*const note = checklistByEquipment\[eqId\]\?\.\[item\.id\]\?\.note \|\| '';/g,
  `equipmentColumnsForChecklist.map(eqId => {
    const val = checklistByEquipment[eqId]?.[item.id]?.status;
    const note = checklistByEquipment[eqId]?.[item.id]?.note || '';`
);

// 5. Close the IIFE closure at the end of the table
content = content.replace(
  /<\/tbody>\s*<\/table>\s*<\/div>/g,
  `      </tbody>
      </table>
    );
  })()}
</div>`
);

fs.writeFileSync(filename, content, 'utf8');
console.log('Modified checklist table to support isCombinedMode');
