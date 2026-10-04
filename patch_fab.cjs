const fs = require('fs');
let content = fs.readFileSync('src/pages/InventoryItems.tsx', 'utf8');

const fabStr = `
      {/* Floating Action Button (FAB) for Mobile QR Scanning */}
      <button
        onClick={() => setIsGlobalQRScannerOpen(true)}
        className="md:hidden fixed bottom-20 right-4 z-40 bg-indigo-600 text-white p-4 rounded-full shadow-lg shadow-indigo-600/30 flex items-center justify-center hover:bg-indigo-700 active:scale-95 transition-all"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
      >
        <ScanLine className="w-6 h-6" />
      </button>
    </div>
  );
};
`;

content = content.replace(/    <\/div>\s*\);\s*\};\s*$/, fabStr);

fs.writeFileSync('src/pages/InventoryItems.tsx', content, 'utf8');
console.log('Added FAB to InventoryItems');
