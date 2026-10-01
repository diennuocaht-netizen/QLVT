const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// The layout blocks to extract
// 1. Chart (B)
const chartRegex = /\{\/\* CHART SECTION \*\/\}\s*<div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm mb-6">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
const chartMatch = content.match(chartRegex);
let B = chartMatch ? chartMatch[0].replace(' mb-6', '') : ''; // remove mb-6 if present

// 2. Today Tasks (C)
const tasksRegex = /\{\/\* Today Tasks \*\/\}\s*<div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
const tasksMatch = content.match(tasksRegex);
let C = tasksMatch ? tasksMatch[0] : '';

// 3. Ongoing Events (D)
const eventsRegex = /\{\/\* Ongoing Events \*\/\}\s*<div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
const eventsMatch = content.match(eventsRegex);
let D = eventsMatch ? eventsMatch[0] : '';

// 4. Active Staff Today (E)
const staffRegex = /\{\/\* Active Staff Today \*\/\}\s*<div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
const staffMatch = content.match(staffRegex);
let E = staffMatch ? staffMatch[0] : '';

// 5. Activity Log (F)
const activityRegex = /\{\/\* Activity Log Compact \*\/\}\s*<div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
const activityMatch = content.match(activityRegex);
let F = activityMatch ? activityMatch[0] : '';


// Find everything before CHART SECTION
const beforeRegex = /([\s\S]*?)(?:\{\/\* CHART SECTION \*\/\}|<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">)/;
const beforeMatch = content.match(beforeRegex);
const beforePart = beforeMatch ? beforeMatch[1] : '';

const newLayout = `
      {/* ROW 1: TASKS (Left 2/3) & STAFF (Right 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          ${C}
        </div>
        <div className="lg:col-span-1">
          ${E}
        </div>
      </div>

      {/* ROW 2: CHART (Left 2/3) & EVENTS (Right 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          ${B}
        </div>
        <div className="lg:col-span-1">
          ${D}
        </div>
      </div>

      {/* ROW 3: ACTIVITY (Full Width) */}
      <div className="grid grid-cols-1 gap-6">
        <div className="lg:col-span-1">
          ${F}
        </div>
      </div>
    </div>
  );
};
`;

if (chartMatch && tasksMatch && eventsMatch && staffMatch && activityMatch) {
    fs.writeFileSync('src/pages/Dashboard.tsx', beforePart + newLayout, 'utf8');
    console.log('Successfully applied fixed exact user layout.');
} else {
    console.log('Failed to extract all components.');
}

