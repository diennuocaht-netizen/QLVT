const fs = require('fs');

// Patch InventoryItems.tsx
let content = fs.readFileSync('src/pages/InventoryItems.tsx', 'utf8');
if (!content.includes('isFilterOpen')) {
  // 1. Add Filter icon import
  content = content.replace(/import {([^}]+)} from 'lucide-react';/, "import { $1, Filter } from 'lucide-react';");
  
  // 2. Add state
  content = content.replace(
    /const \[searchTerm, setSearchTerm\] = useState\(''\);/,
    `const [searchTerm, setSearchTerm] = useState('');\n  const [isFilterOpen, setIsFilterOpen] = useState(false);`
  );
  
  // 3. Update layout
  const searchBlockTarget = `<div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="TAm kim theo mA, tAn hoc danh mc..."`;
  // I will just use regex to replace the structure
  content = content.replace(
    /<div className="flex gap-4 items-center">\s*<div className="flex-1 relative">\s*<Search className="absolute left-3 top-3 text-gray-400" size=\{20\} \/>\s*<input/,
    `<div className="flex flex-col md:flex-row gap-4 md:items-center">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input`
  );
  
  content = content.replace(
    /className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"\s*\/>\s*<\/div>\s*<div className="w-48">/m,
    `className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button 
            onClick={() => setIsFilterOpen(!isFilterOpen)} 
            className="md:hidden flex items-center justify-center p-2 bg-gray-100 text-gray-600 rounded-lg border border-gray-300 shrink-0"
          >
            <Filter className="w-6 h-6" />
          </button>
        </div>
        <div className={\`w-full md:w-48 \${isFilterOpen ? 'block' : 'hidden md:block'}\`}>`
  );

  fs.writeFileSync('src/pages/InventoryItems.tsx', content, 'utf8');
}
console.log('Patched InventoryItems.tsx filters');

// Patch Devices.tsx
let contentDev = fs.readFileSync('src/pages/Devices.tsx', 'utf8');
if (!contentDev.includes('isFilterOpen')) {
  contentDev = contentDev.replace(/import {([^}]+)} from 'lucide-react';/, "import { $1, Filter } from 'lucide-react';");
  
  contentDev = contentDev.replace(
    /const \[searchTerm, setSearchTerm\] = useState\(''\);/,
    `const [searchTerm, setSearchTerm] = useState('');\n  const [isFilterOpen, setIsFilterOpen] = useState(false);`
  );
  
  contentDev = contentDev.replace(
    /className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 items-center justify-between"/,
    `className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 md:items-center justify-between"`
  );

  contentDev = contentDev.replace(
    /<div className="relative flex-1 w-full max-w-md">\s*<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">/,
    `<div className="flex gap-2 w-full max-w-md">
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">`
  );

  contentDev = contentDev.replace(
    /value=\{searchTerm\}\s*onChange=\{\(e\) => setSearchTerm\(e.target.value\)\}\s*\/>\s*<\/div>\s*<div className="w-full sm:w-64 shrink-0">/m,
    `value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)} 
              className="sm:hidden flex items-center justify-center p-2 bg-gray-100 text-gray-600 rounded-md border border-gray-300 shrink-0"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
          <div className={\`w-full sm:w-64 shrink-0 \${isFilterOpen ? 'block' : 'hidden sm:block'}\`}>`
  );
  
  fs.writeFileSync('src/pages/Devices.tsx', contentDev, 'utf8');
}
console.log('Patched Devices.tsx filters');

