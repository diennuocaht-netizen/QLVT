const fs = require('fs');
let content = fs.readFileSync('src/pages/Devices.tsx', 'utf8');

// The block starts with {/* Quick Search Section */}
// We can wrap it with an accordion or hidden block on mobile.
if (!content.includes('isAdvancedSearchOpen')) {
  content = content.replace(
    /const \[isFilterOpen, setIsFilterOpen\] = useState\(false\);/,
    `const [isFilterOpen, setIsFilterOpen] = useState(false);\n  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);`
  );
  
  content = content.replace(
    /\{\/\* Quick Search Section \*\/\}/,
    `{/* Quick Search Toggle Mobile */}
        <button 
          onClick={() => setIsAdvancedSearchOpen(!isAdvancedSearchOpen)} 
          className="md:hidden w-full flex justify-between items-center bg-indigo-50 text-indigo-700 p-3 rounded-lg border border-indigo-100 font-medium shadow-sm"
        >
          <div className="flex items-center">
            <Zap className="w-5 h-5 mr-2" /> Tra cứu nhanh Line/Tủ
          </div>
          <span className="text-xl leading-none">{isAdvancedSearchOpen ? '−' : '+'}</span>
        </button>
        
        {/* Quick Search Section */}
        <div className={\`\${isAdvancedSearchOpen ? 'block' : 'hidden md:block'}\`}>`
  );

  // We need to close the div right before the main table block:
  // <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
  content = content.replace(
    /<div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">/,
    `</div>\n\n        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">`
  );
  
  fs.writeFileSync('src/pages/Devices.tsx', content, 'utf8');
}
console.log('Wrapped Quick Search in Devices.tsx');
