const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

function extractBlock(startMarker) {
    let startIndex = content.indexOf(startMarker);
    if (startIndex === -1) return null;
    
    let divStart = content.indexOf('<div', startIndex);
    if (divStart === -1) return null;

    let i = divStart;
    let depth = 0;
    while (i < content.length) {
        if (content.substring(i, i + 4) === '<div') {
            depth++;
            i += 4;
        } else if (content.substring(i, i + 6) === '</div>') {
            depth--;
            i += 6;
            if (depth === 0) {
                return content.substring(startIndex, i);
            }
        } else {
            i++;
        }
    }
    return null;
}

const B = extractBlock('{/* CHART SECTION */}');
const C = extractBlock('{/* Today Tasks */}');
const D = extractBlock('{/* Ongoing Events */}');
const E = extractBlock('{/* Active Staff Today */}');
const F = extractBlock('{/* Activity Log Compact */}');

if (B && C && D && E && F) {
    let cleanB = B;
    
    // Find everything before MAIN 2-COLUMN LAYOUT
    const beforePart = content.substring(0, content.indexOf('{/* MAIN 2-COLUMN LAYOUT */}'));
    
    const newLayout = `
      {/* MAIN 2-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-6">
          $C
          $B
          $D
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-1 space-y-6">
          $E
          $F
        </div>
      </div>
    </div>
  );
};
`;
    let finalCode = beforePart + newLayout
        .replace('$C', C)
        .replace('$E', E)
        .replace('$B', cleanB)
        .replace('$D', D)
        .replace('$F', F);

    fs.writeFileSync('src/pages/Dashboard.tsx', finalCode, 'utf8');
    console.log('Successfully re-arranged layout D and F.');
} else {
    console.log('Failed to extract some components');
}

