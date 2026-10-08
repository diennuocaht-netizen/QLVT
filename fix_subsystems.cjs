const fs = require('fs');

function fixSubsystems(filename) {
    let content = fs.readFileSync(filename, 'utf8');
    let original = content;

    content = content.replace(
      /const combinedSubsystems = Array\.from\(new Set\(\[\.\.\.subsystems\.map\(s => s\.name\), \.\.\.costCodes\.map\(c => c\.subsystem\)\]\.filter\(Boolean\)\)\);/g,
      "const combinedSubsystems = Array.from(new Set(costCodes.map(c => c.subsystem).filter(Boolean)));"
    );

    if (content !== original) {
        fs.writeFileSync(filename, content, 'utf8');
        console.log('Fixed', filename);
    }
}

['src/components/inventory/SlipModal.tsx', 'src/components/inventory/QuickIssueModal.tsx', 'src/components/inventory/RequisitionModal.tsx'].forEach(fixSubsystems);

