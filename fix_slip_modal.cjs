const fs = require('fs');

const filename = 'src/components/inventory/SlipModal.tsx';
let content = fs.readFileSync(filename, 'utf8');

// 1. Fix grid layout for the form
content = content.replace(/<div className="grid grid-cols-2 gap-6">/g, '<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">');

// 2. Fix col-span-2 to be responsive (used for Mục đích, Tờ trình mua sắm, etc.)
content = content.replace(/className="col-span-2/g, 'className="col-span-1 sm:col-span-2');

// 3. Fix the "Chọn tờ trình mua sắm" flex layout
content = content.replace(/<div className="flex gap-2">\s*<select/g, '<div className="flex flex-col sm:flex-row gap-2 sm:gap-3">\n                        <select');

// 4. Fix "Danh sách Vật tư" and its buttons layout
content = content.replace(/<div className="flex justify-between items-center mb-4">/g, '<div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">');

// 5. Ensure modal max width is responsive and uses w-full on mobile
content = content.replace(/w-full max-w-\[90vw\]/g, 'w-full max-w-[95vw] md:max-w-[90vw]');

fs.writeFileSync(filename, content, 'utf8');
console.log('Fixed SlipModal layout for mobile');
