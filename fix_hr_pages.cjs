const fs = require('fs');

function fixFile(filename, replacements) {
  if (!fs.existsSync(filename)) return;
  let content = fs.readFileSync(filename, 'utf8');
  
  for (const { regex, replace } of replacements) {
    content = content.replace(regex, replace);
  }
  
  fs.writeFileSync(filename, content, 'utf8');
  console.log('Fixed ' + filename);
}

// HRTasks.tsx
fixFile('src/pages/HRTasks.tsx', [
  {
    regex: /<div className="flex justify-between items-center shrink-0">/,
    replace: '<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0">'
  },
  {
    regex: /<h1 className="text-2xl font-bold text-gray-900">/,
    replace: '<h1 className="text-xl md:text-2xl font-bold text-gray-900 whitespace-nowrap">'
  },
  {
    regex: /<div className="flex gap-2">/,
    replace: '<div className="flex flex-wrap gap-2 mt-2 md:mt-0">'
  },
  {
    regex: /className="bg-gray-100 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-200 flex items-center shadow-sm font-medium transition-colors border border-gray-200"/,
    replace: 'className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 shadow-sm transition-colors border border-gray-200"'
  },
  {
    regex: /className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center shadow-sm font-medium transition-colors"/,
    replace: 'className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 shadow-sm transition-colors"'
  },
  {
    regex: /className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center shadow-sm font-medium transition-colors"/,
    replace: 'className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm transition-colors whitespace-nowrap"'
  },
  { regex: /<Settings className="w-4 h-4 mr-1\.5" \/>/, replace: '<Settings size={18} />' },
  { regex: /<FileText className="w-4 h-4 mr-2" \/>/, replace: '<FileText size={18} />' },
  { regex: /<Plus className="w-5 h-5 mr-2" \/>/, replace: '<Plus size={18} />' },
]);

// HRTaskLog.tsx
fixFile('src/pages/HRTaskLog.tsx', [
  {
    regex: /<h1 className="text-2xl font-bold text-gray-900 mb-2">/,
    replace: '<h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 whitespace-nowrap">'
  },
  {
    regex: /<div className="flex gap-4 items-end flex-wrap">/,
    replace: '<div className="flex gap-3 items-end flex-wrap">'
  },
  {
    regex: /className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center shadow-sm shrink-0 h-10"/,
    replace: 'className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 shadow-sm shrink-0 whitespace-nowrap"'
  },
  { regex: /<Download className="w-5 h-5 mr-2" \/>/, replace: '<Download size={18} />' },
]);

// HREvents.tsx
fixFile('src/pages/HREvents.tsx', [
  {
    regex: /<div className="flex justify-between items-center mb-6">/,
    replace: '<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4 md:mb-6">'
  },
  {
    regex: /<h1 className="text-2xl font-bold text-gray-900">/,
    replace: '<h1 className="text-xl md:text-2xl font-bold text-gray-900 whitespace-nowrap">'
  },
  {
    regex: /className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center shadow-sm shrink-0"/,
    replace: 'className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm shrink-0 whitespace-nowrap"'
  },
  { regex: /<Plus className="w-5 h-5 mr-2" \/>/, replace: '<Plus size={18} />' },
]);

// ShiftSchedule.tsx
fixFile('src/pages/ShiftSchedule.tsx', [
  {
    regex: /<div className="flex justify-between items-start mb-6">/,
    replace: '<div className="flex flex-col md:flex-row justify-between items-start gap-3 mb-6">'
  },
  {
    regex: /<h1 className="text-2xl font-bold text-gray-900">/,
    replace: '<h1 className="text-xl md:text-2xl font-bold text-gray-900 whitespace-nowrap">'
  },
  {
    regex: /<div className="flex gap-4">/,
    replace: '<div className="flex flex-wrap gap-2">'
  },
  {
    regex: /<div className="flex items-center bg-white border border-gray-300 rounded-md shadow-sm px-3 py-2">/,
    replace: '<div className="flex items-center bg-white border border-gray-300 rounded-md shadow-sm px-2 py-1.5 text-sm">'
  },
  {
    regex: /className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-md hover:bg-indigo-100 flex items-center font-medium border border-indigo-200"/,
    replace: 'className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100 border border-indigo-200 whitespace-nowrap"'
  },
  { regex: /<LayoutGrid className="w-5 h-5 mr-2" \/>/, replace: '<LayoutGrid size={18} />' },
]);

