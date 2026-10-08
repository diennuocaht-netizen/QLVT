const fs = require('fs');

function fixAutoMatch(filename) {
    let content = fs.readFileSync(filename, 'utf8');
    let original = content;

    // 1. Fix auto-match condition
    content = content.replace(
      /if \(currentItem\.itemId && currentItem\.subsystem && currentItem\.purpose && currentItem\.method\) \{/g,
      "if (currentItem.itemId) {"
    );

    // 2. Add combinedSubsystems
    if (content.includes("const uniqueMethods = Array.from(new Set(costCodes.map")) {
        content = content.replace(
          /const uniqueMethods = Array\.from\(new Set\(costCodes\.map/g,
          "const combinedSubsystems = Array.from(new Set([...subsystems.map(s => s.name), ...costCodes.map(c => c.subsystem)].filter(Boolean)));\n  const uniqueMethods = Array.from(new Set(costCodes.map"
        );

        // 3. Update the dropdown for subsystem
        content = content.replace(
          /\{subsystems\.map\(sub => \(\s*<option key=\{sub\.id\} value=\{sub\.name\}>\{sub\.name\}<\/option>\s*\)\)\}/g,
          "{combinedSubsystems.map(sub => (\n                                    <option key={sub} value={sub}>{sub}</option>\n                                  ))}"
        );
    }
    
    // For QuickIssueModal, it might not use array mapping or different variable names
    if (filename.includes('QuickIssueModal')) {
        // QuickIssueModal uses item state instead of currentItem? Let's check it manually if needed, or just replace the specific string
        content = content.replace(
          /if \(item\.subsystem && item\.purpose && item\.method\) \{/g,
          "if (true) {"
        );
        content = content.replace(
          /if \(itemId && subsystem && purpose && method\) \{/g,
          "if (itemId) {"
        );
        content = content.replace(
          /\{subsystems\.map\(sub => \(\s*<option key=\{sub\.id\} value=\{sub\.name\}>\{sub\.name\}<\/option>\s*\)\)\}/g,
          "{combinedSubsystems.map(sub => (\n                                    <option key={sub} value={sub}>{sub}</option>\n                                  ))}"
        );
    }

    if (content !== original) {
        fs.writeFileSync(filename, content, 'utf8');
        console.log('Fixed', filename);
    }
}

['src/components/inventory/QuickIssueModal.tsx', 'src/components/inventory/RequisitionModal.tsx'].forEach(fixAutoMatch);

