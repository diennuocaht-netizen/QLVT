const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// The layout right now:
// {/* CHART SECTION */}
// <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm"> ... </div>
//
// {/* OVERVIEW CARDS */}
// <div className="grid grid-cols-2 md:grid-cols-5 gap-4"> ... </div>

// First, I'll extract both blocks.
const chartRegex = /\{\/\* CHART SECTION \*\/\}\s*<div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;
const chartMatch = content.match(chartRegex);

const overviewRegex = /\{\/\* OVERVIEW CARDS \*\/\}\s*<div className="grid grid-cols-2 md:grid-cols-5 gap-4">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/;
const overviewMatch = content.match(overviewRegex);

if (chartMatch && overviewMatch) {
    let newOverview = overviewMatch[0].replace(
        '<div className="grid grid-cols-2 md:grid-cols-5 gap-4">',
        '<div className="grid grid-cols-2 md:grid-cols-3 gap-4">'
    );
    // Make the chart fit the new layout
    let newChart = chartMatch[0].replace(
        '<div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">',
        '<div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm h-full">'
    );

    const newLayout = `<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col justify-center">
            \${newOverview}
        </div>
        <div className="lg:col-span-1">
            \${newChart}
        </div>
    </div>`;

    // Remove the old blocks and insert the new layout
    let newContent = content.replace(chartMatch[0], '');
    newContent = newContent.replace(overviewMatch[0], newLayout);
    
    fs.writeFileSync('src/pages/Dashboard.tsx', newContent, 'utf8');
    console.log('Layout patched successfully');
} else {
    console.log('Could not find matches');
}
