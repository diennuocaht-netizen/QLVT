const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('pageerror', err => {
    console.log('PAGE ERROR:', err.toString());
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('CONSOLE ERROR:', msg.text());
    }
  });
  
  await page.goto('http://localhost:5173/inventory/items', { waitUntil: 'networkidle2' }).catch(e => console.log(e));
  
  // Wait a bit to see if anything crashes
  await new Promise(r => setTimeout(r, 3000));
  
  await browser.close();
})();
