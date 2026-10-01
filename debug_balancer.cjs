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
        } else if (content.substring(i, i + 5) === '</div') { // BUG: I used `</div` which is 5 chars, but I did substring(i, i+6) in the previous script!
            depth--;
            i += 5;
            if (depth === 0) {
                let end = content.indexOf('>', i - 5) + 1;
                return content.substring(startIndex, end);
            }
        } else {
            i++;
        }
    }
    return null;
}

console.log('B len:', extractBlock('{/* CHART SECTION */}')?.length);
console.log('C len:', extractBlock('{/* Today Tasks */}')?.length);
console.log('D len:', extractBlock('{/* Ongoing Events */}')?.length);
console.log('E len:', extractBlock('{/* Active Staff Today */}')?.length);
console.log('F len:', extractBlock('{/* Activity Log Compact */}')?.length);
