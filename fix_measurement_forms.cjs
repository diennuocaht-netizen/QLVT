const fs = require('fs');

function fixMeasurementForms() {
  const filename = 'src/pages/MeasurementForms.tsx';
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

fixMeasurementForms();
console.log('Fixed MeasurementForms');
