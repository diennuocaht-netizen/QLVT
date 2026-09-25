const fs = require('fs');
const file = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(file, 'utf8');

const summaryUI = `
        {/* Today Summary */}
        {isMonthCreated && todayCounts && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 shadow-sm flex flex-wrap gap-3 items-center shrink-0">
            <div className="font-bold text-blue-900 mr-2 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Tổng hợp ca hôm nay ({today.toLocaleDateString('vi-VN')}):
            </div>
            <div className="bg-white px-3 py-1 rounded shadow-sm border border-gray-200">
              <span className="text-gray-500 text-sm">Tổng nhân sự: </span>
              <span className="font-bold">{todayCounts.totalEmployees}</span>
            </div>
            <div className="bg-white px-3 py-1 rounded shadow-sm border border-gray-200">
              <span className="text-gray-500 text-sm">Có lịch: </span>
              <span className="font-bold text-indigo-600">{todayCounts.totalScheduled}</span>
            </div>
            {shiftTypes.map(st => {
              const count = todayCounts.counts[st.id] || 0;
              if (count === 0) return null;
              return (
                <div key={st.id} className="bg-white px-3 py-1 rounded shadow-sm border" style={{ borderColor: st.text_color }}>
                  <span className="font-bold text-sm mr-1" style={{ color: st.text_color }}>Ca {st.code}:</span>
                  <span className="font-bold">{count}</span>
                </div>
              );
            })}
          </div>
        )}
`;

content = content.replace(
  `      </div>\n    </div>\n  );\n};`,
  summaryUI + `      </div>\n    </div>\n  );\n};`
);

fs.writeFileSync(file, content, 'utf8');
console.log('OK');
