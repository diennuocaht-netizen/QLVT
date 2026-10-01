const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Find the grid wrapper I added:
// <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//    <div className="lg:col-span-2 flex flex-col justify-center">
//        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
//             ... cards ...
//        </div>
//    </div>
//    <div className="lg:col-span-1">
//        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm h-full">
//             ... chart ...
//        </div>
//    </div>
// </div>

const layoutRegex = /<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">\s*<div className="lg:col-span-2 flex flex-col justify-center">\s*(<div className="grid grid-cols-2 md:grid-cols-3 gap-4">[\s\S]*?<\/div>)\s*<\/div>\s*<div className="lg:col-span-1">\s*(<div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm h-full">[\s\S]*?<\/div>)\s*<\/div>\s*<\/div>/;

const match = content.match(layoutRegex);
if (match) {
    let cards = match[1];
    let chart = match[2];
    
    // Revert classes back
    cards = cards.replace('md:grid-cols-3', 'md:grid-cols-5');
    chart = chart.replace('shadow-sm h-full"', 'shadow-sm"');
    
    // Stack them: cards first, chart second, or chart first?
    // Originally my code put chart first, then cards. I'll put chart first.
    const newLayout = `${chart}\n\n        ${cards}`;
    
    content = content.replace(layoutRegex, newLayout);
    fs.writeFileSync('src/pages/Dashboard.tsx', content, 'utf8');
    console.log('Reverted layout');
} else {
    console.log('Could not find layout to revert');
}
