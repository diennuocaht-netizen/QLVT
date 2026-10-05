const fs = require('fs');
const filename = 'src/pages/ShiftSchedule.tsx';
let content = fs.readFileSync(filename, 'utf8');

content = content.replace(
  /<div className="flex space-x-2 text-xs">/g, 
  '<div className="flex flex-wrap gap-1 md:gap-2 text-[10px] md:text-xs">'
);

content = content.replace(
  /<span className="text-gray-600">: \{st.name\}<\/span>/g, 
  '<span className="text-gray-600 hidden md:inline">: {st.name}</span>'
);

content = content.replace(
  /className="flex items-center space-x-1 border px-2 py-1 rounded"/g, 
  'className="flex items-center md:space-x-1 border px-1 md:px-2 py-0.5 md:py-1 rounded"'
);

fs.writeFileSync(filename, content, 'utf8');
console.log('Fixed shift legends');
