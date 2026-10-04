const fs = require('fs');
let content = fs.readFileSync('src/pages/Devices.tsx', 'utf8');

content = content.replace(
    /<\/div>\s*\);\s*\};\s*$/,
    `
      <VerifyDevicesModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        devices={devices}
        onVerified={() => {
          fetchDevices();
        }}
      />
    </div>
  );
};
`
);

fs.writeFileSync('src/pages/Devices.tsx', content, 'utf8');
console.log('Fixed VerifyDevicesModal render in Devices.tsx');
