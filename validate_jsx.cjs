const fs = require('fs');
const babel = require('@babel/core');

const content = fs.readFileSync('src/pages/InventoryItems.tsx', 'utf8');
try {
  babel.transformSync(content, {
    filename: 'InventoryItems.tsx',
    presets: ['@babel/preset-react', '@babel/preset-typescript']
  });
  console.log("JSX is valid.");
} catch (e) {
  console.log("JSX Error:");
  console.log(e.message);
}
