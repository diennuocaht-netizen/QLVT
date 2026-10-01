const fs = require('fs');
let content = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

function extractBlock(startMarker) {
    let startIndex = content.indexOf(startMarker);
    if (startIndex === -1) return null;
    
    // Find the first '<div' after the marker
    let divStart = content.indexOf('<div', startIndex);
    if (divStart === -1) return null;

    let i = divStart;
    let depth = 0;
    while (i < content.length) {
        if (content.substring(i, i + 4) === '<div') {
            depth++;
            i += 4;
        } else if (content.substring(i, i + 6) === '</div') {
            depth--;
            i += 6;
            if (depth === 0) {
                // Found the end of this block!
                // Return the whole block from the marker to the closing div
                let end = content.indexOf('>', i - 6) + 1;
                return content.substring(startIndex, end);
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
    // Remove the mb-6 from Chart if present
    const cleanB = B.replace(' mb-6"', '"');
    
    // Find everything before CHART SECTION
    const beforePart = content.substring(0, content.indexOf('{/* CHART SECTION */}'));
    
    // We want to replace the whole bottom part with the new layout
    const newLayout = `
      {/* ROW 1: TASKS (Left 2/3) & STAFF (Right 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          \${C}
        </div>
        <div className="lg:col-span-1">
          \${E}
        </div>
      </div>

      {/* ROW 2: CHART (Left 2/3) & EVENTS (Right 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          \${cleanB}
        </div>
        <div className="lg:col-span-1">
          \${D}
        </div>
      </div>

      {/* ROW 3: ACTIVITY (Full Width) */}
      <div className="grid grid-cols-1 gap-6 mt-6">
        <div className="lg:col-span-1">
          \${F}
        </div>
      </div>
    </div>
  );
};
`;
    // We construct the string without template literal injection to avoid escaping issues
    let finalCode = beforePart + newLayout
        .replace('\\${C}', C)
        .replace('\\${E}', E)
        .replace('\\${cleanB}', cleanB)
        .replace('\\${D}', D)
        .replace('\\${F}', F);

    fs.writeFileSync('src/pages/Dashboard.tsx', finalCode, 'utf8');
    console.log('Successfully re-arranged layout with bracket balancing.');
} else {
    console.log('Failed to extract some components');
}

