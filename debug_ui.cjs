const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });

  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
  });

  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 10000 });
  } catch(e) {
    console.log('Navigation error:', e.message);
  }

  // Check if root is empty
  const rootHtml = await page.evaluate(() => {
    const root = document.getElementById('root');
    return root ? root.innerHTML : 'NO ROOT';
  });
  
  if (rootHtml === '' || rootHtml === 'NO ROOT') {
    console.log('ROOT IS EMPTY OR MISSING! App crashed or didn\'t render.');
  } else {
    console.log('Root has content. HTML length:', rootHtml.length);
  }
  
  await browser.close();
})();
