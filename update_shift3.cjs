const fs = require('fs');
const file = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(file, 'utf8');

// 5. Month creation logic
const hasDataLogic = `
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const monthKey = \`\${year}-\${month}\`;
  
  const hasDataThisMonth = useMemo(() => {
    return Object.values(assignments).some(empAssignments => {
      return Object.keys(empAssignments).some(dateStr => dateStr.startsWith(\`\${year}-\${month.toString().padStart(2, '0')}\`));
    });
  }, [assignments, year, month]);
  
  const isMonthCreated = hasDataThisMonth || monthCreatedState[monthKey];
`;

if (!content.includes('const isMonthCreated')) {
  content = content.replace(
    "const hasUnsavedChanges =",
    hasDataLogic + "\n  const hasUnsavedChanges ="
  );
}

// Wrap the table
const originalTableContainer = `<div className="flex-1 overflow-auto bg-white border border-gray-200 rounded-lg shadow-sm">
            <table className="w-full border-collapse" style={{ minWidth: '1500px' }}>`;
            
if (content.includes(originalTableContainer)) {
  content = content.replace(
    originalTableContainer,
    `{!isMonthCreated ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
              <Calendar className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tháng {month}/{year} chưa có dữ liệu lịch</h3>
              <p className="text-gray-500 mb-6">Bạn cần khởi tạo lịch cho tháng này trước khi thêm dữ liệu.</p>
              {canEdit && (
                <button
                  onClick={() => setMonthCreatedState(prev => ({ ...prev, [monthKey]: true }))}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 font-medium"
                >
                  Tạo lịch tháng {month}/{year}
                </button>
              )}
            </div>
          ) : (
          <div className="flex-1 overflow-auto bg-white border border-gray-200 rounded-lg shadow-sm">
            <table className="w-full border-collapse" style={{ minWidth: '1500px' }}>`
  );
  
  // Close the parenthesis for isMonthCreated
  content = content.replace(
    `</table>
          </div>
        ) : (`,
    `</table>
          </div>
          )}
        ) : (`
  );
}

// 6. Increase Font Size in Calendar View
content = content.replace(
  `<div key={idx} className="text-xs truncate">`,
  `<div key={idx} className="text-sm font-medium py-0.5 whitespace-normal leading-tight">`
);

content = content.replace(
  `<span className="font-semibold" style={{ color: sType?.text_color }}>{sType?.code}:</span> {group.map(e => e.full_name).join(', ')}`,
  `<span className="font-bold text-[15px]" style={{ color: sType?.text_color }}>{sType?.code}:</span> {group.map(e => e.full_name).join(', ')}`
);

fs.writeFileSync(file, content, 'utf8');
console.log('OK');
