const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  page.on('response', response => {
    if (!response.ok()) console.log(`HTTP ${response.status()} ${response.url()}`);
  });

  await page.goto('http://localhost:5173/login');
  
  // type email and password
  await page.type('input[type="email"]', 'user@reviewmod.com');
  await page.type('input[type="password"]', 'User@1234');
  await page.click('button[type="submit"]');

  // wait a bit for transition
  await new Promise(r => setTimeout(r, 2000));
  
  await browser.close();
})();
