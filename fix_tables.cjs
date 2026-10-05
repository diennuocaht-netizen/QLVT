const fs = require('fs');
const path = require('path');

const dir = 'src/components/inventory';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

files.forEach(f => {
  const filePath = path.join(dir, f);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Find all <table ...> and ensure they have whitespace-nowrap if they don't already
  content = content.replace(/<table className="([^"]+)">/g, (match, classes) => {
    if (!classes.includes('whitespace-nowrap') && !classes.includes('whitespace-normal')) {
      changed = true;
      return `<table className="${classes} whitespace-nowrap">`;
    }
    return match;
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${f}`);
  }
});
