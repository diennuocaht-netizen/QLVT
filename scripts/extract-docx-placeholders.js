import fs from 'fs';
import path from 'path';
import PizZip from 'pizzip';

const usage = () => {
  console.log('Usage: node scripts/extract-docx-placeholders.js <path-to-docx>');
};

const filePath = process.argv[2] || path.join(process.cwd(), 'templates', 'to-trinh-template.docx');

if (!fs.existsSync(filePath)) {
  console.error('Template not found at', filePath);
  usage();
  process.exit(1);
}

const buffer = fs.readFileSync(filePath);
let zip;
try {
  zip = new PizZip(buffer);
} catch (err) {
  console.error('Failed to read docx zip:', err.message || err);
  process.exit(2);
}

const entriesToCheck = ['word/document.xml', 'word/header1.xml', 'word/header2.xml', 'word/footer1.xml', 'word/footer2.xml'];
const rawTexts = [];

for (const entry of entriesToCheck) {
  try {
    const content = zip.file(entry)?.asText();
    if (content) rawTexts.push(content);
  } catch (e) {
    // ignore missing parts
  }
}

if (rawTexts.length === 0) {
  console.error('No document parts found to scan for placeholders.');
  process.exit(3);
}

const combined = rawTexts.join('\n');

// Common placeholder patterns: {{tag}}, {#items}...{/items}, {{tag.sub}}, ${...}
const patterns = [
  /\{\{[#\/]?[^}]+\}\}/g,    // handlebars / docxtemplater style
  /\{[#\/]?[^}]+\}/g,          // {#items} style
  /\$\{[^}]+\}/g,              // ${var} style
];

const found = new Set();

for (const p of patterns) {
  const matches = combined.match(p) || [];
  for (const m of matches) found.add(m);
}

// Normalize and categorize
const tags = Array.from(found).map(t => t.trim()).sort();
const simple = new Set();
const loops = new Set();

for (const t of tags) {
  // remove surrounding braces for analysis
  const inner = t.replace(/^\{+|\}+$/g, '').trim();
  if (inner.startsWith('#') || inner.startsWith('/')) {
    loops.add(t);
  } else {
    simple.add(t);
  }
}

console.log('Found placeholders:');
if (simple.size === 0 && loops.size === 0) {
  console.log('  (none detected)');
} else {
  if (simple.size > 0) {
    console.log('\nSimple tags:');
    for (const s of Array.from(simple).sort()) console.log('  ', s);
  }
  if (loops.size > 0) {
    console.log('\nLoop / block tags:');
    for (const s of Array.from(loops).sort()) console.log('  ', s);
  }
}

// Attempt to extract variable names without braces
const extractName = (raw) => raw.replace(/^\{+|\}+$/g, '').replace(/^#|^\/|\/?$/g, '').trim();

const mapping = {
  simple: Array.from(simple).map(s => ({ raw: s, name: extractName(s) })),
  loops: Array.from(loops).map(s => ({ raw: s, name: extractName(s) })),
};

console.log('\nMapping suggestion (name only):');
console.log(JSON.stringify(mapping, null, 2));

console.log('\nDone.');
