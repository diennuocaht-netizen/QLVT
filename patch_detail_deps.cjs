const fs = require('fs');

let content = fs.readFileSync('src/components/inventory/DetailSlipModal.tsx', 'utf8');

// The original `loadAndSubscribe();\n      return () => {\n        if (channel) supabase.removeChannel(channel);\n      };\n    }, []);`
content = content.replace(/loadAndSubscribe\(\);\s*return \(\) => \{\s*if \(channel\) supabase.removeChannel\(channel\);\s*\};\s*\}, \[\]\);/g, `loadAndSubscribe();
      return () => {
        if (channel) supabase.removeChannel(channel);
      };
    }, [slip?.id]);`);

fs.writeFileSync('src/components/inventory/DetailSlipModal.tsx', content, 'utf8');
console.log('Patched DetailSlipModal useEffect dependencies');
