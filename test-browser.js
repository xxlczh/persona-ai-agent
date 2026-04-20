const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // 打开前端
  await page.goto('http://localhost:5173');
  await page.waitForLoadState('networkidle');
  
  // 截图
  await page.screenshot({ path: 'tests/screenshots/frontend-load.png', fullPage: true });
  
  // 获取页面标题
  const title = await page.title();
  console.log('Page title:', title);
  
  // 获取主要文字内容
  const bodyText = await page.locator('body').innerText();
  console.log('Page content preview:', bodyText.substring(0, 500));
  
  await browser.close();
  console.log('Screenshot saved to tests/screenshots/frontend-load.png');
})();
