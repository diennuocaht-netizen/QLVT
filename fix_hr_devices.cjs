const fs = require('fs');

function fixDevices() {
  const filename = 'src/pages/Devices.tsx';
  let content = fs.readFileSync(filename, 'utf8');

  // Replace header outer div
  content = content.replace(
    /<div className="flex justify-between items-center">\s*<h1 className="text-2xl font-bold text-gray-900">Quản lý Thiết bị<\/h1>\s*\{canEdit && \(\s*<div className="flex gap-2">/s,
    `<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
          <h1 className="text-2xl font-bold text-gray-900 whitespace-nowrap">Quản lý Thiết bị</h1>
          {canEdit && (
            <div className="flex flex-wrap gap-2 mt-2 md:mt-0">`
  );

  // Shrink Import buttons
  content = content.replace(
    /className="bg-white text-gray-700 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center text-sm font-medium disabled:opacity-50"/g,
    'className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 shadow-sm disabled:opacity-50"'
  );

  // Shrink Xác nhận kiểm tra
  content = content.replace(
    /className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center text-sm font-medium shadow-sm mr-2"/g,
    'className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-green-600 text-white rounded-md hover:bg-green-700 shadow-sm"'
  );

  // Shrink Thêm
  content = content.replace(
    /className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center text-sm font-medium"/g,
    'className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm whitespace-nowrap"'
  );

  // Shrink mr-2 icons
  content = content.replace(/<CheckCircle className="w-4 h-4 mr-2" \/>/g, '<CheckCircle size={18} />');
  content = content.replace(/<Plus className="w-5 h-5 mr-2" \/>/g, '<Plus size={18} />');

  fs.writeFileSync(filename, content, 'utf8');
}

function fixMeasuredEquipments() {
  const filename = 'src/pages/MeasuredEquipments.tsx';
  if (!fs.existsSync(filename)) return;
  let content = fs.readFileSync(filename, 'utf8');

  content = content.replace(
    /<div className="flex justify-between items-center mb-6">/s,
    '<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4 md:mb-6">'
  );

  content = content.replace(
    /<h1 className="text-2xl font-bold text-gray-900 flex items-center">/g,
    '<h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center whitespace-nowrap">'
  );

  content = content.replace(
    /className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center shadow-sm"/g,
    'className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm whitespace-nowrap"'
  );

  fs.writeFileSync(filename, content, 'utf8');
}

function fixMeasurementRecords() {
  const filename = 'src/pages/MeasurementRecords.tsx';
  if (!fs.existsSync(filename)) return;
  let content = fs.readFileSync(filename, 'utf8');

  content = content.replace(
    /<div className="flex justify-between items-center mb-6">/s,
    '<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4 md:mb-6">'
  );

  content = content.replace(
    /<h1 className="text-2xl font-bold text-gray-900 flex items-center">/g,
    '<h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center whitespace-nowrap">'
  );
  
  // Fix search box flex wrapper
  content = content.replace(
    /<div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">/s,
    '<div className="p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-gray-50">'
  );

  // Fix button inside search block
  content = content.replace(
    /className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"/g,
    'className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm whitespace-nowrap"'
  );

  fs.writeFileSync(filename, content, 'utf8');
}

function fixMeasurementTemplates() {
  const filename = 'src/pages/MeasurementTemplates.tsx';
  if (!fs.existsSync(filename)) return;
  let content = fs.readFileSync(filename, 'utf8');

  content = content.replace(
    /<div className="flex justify-between items-center mb-6">/s,
    '<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4 md:mb-6">'
  );

  content = content.replace(
    /<h1 className="text-2xl font-bold text-gray-900 flex items-center">/g,
    '<h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center whitespace-nowrap">'
  );

  content = content.replace(
    /className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center shadow-sm"/g,
    'className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-indigo-600 text-white rounded-md hover:bg-indigo-700 shadow-sm whitespace-nowrap"'
  );

  fs.writeFileSync(filename, content, 'utf8');
}

fixDevices();
fixMeasuredEquipments();
fixMeasurementRecords();
fixMeasurementTemplates();
console.log('Fixed HR / Device headers');
