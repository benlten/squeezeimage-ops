const { test, expect } = require('@playwright/test');

const base = process.env.BASE_URL || 'https://www.squeezeimage.com';
const demoEmail = process.env.DEMO_EMAIL;
const demoPassword = process.env.DEMO_PASSWORD;

test.describe('Debug Login Flow', () => {

  test('debug what happens after login', async ({ page }) => {
    if (!demoEmail || !demoPassword) {
      test.skip('Demo credentials not available');
    }

    console.log('Starting login debug...');
    
    // Go to login page
    await page.goto(`${base}/accounts/login/`);
    await page.waitForTimeout(1000);
    
    console.log('Login page loaded');
    
    // Fill and submit login form
    await page.locator('.form-input').first().fill(demoEmail);
    await page.locator('.form-input').nth(1).fill(demoPassword);
    await page.locator('.btn-primary').click();
    
    console.log('Login form submitted');
    
    // Wait and see what happens
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log(`Current URL after login: ${currentUrl}`);
    
    const pageTitle = await page.title();
    console.log(`Page title: ${pageTitle}`);
    
    // Get page text content
    const bodyText = await page.locator('body').textContent();
    console.log(`Body contains (first 500 chars): ${bodyText.substring(0, 500)}...`);
    
    // Check for common elements
    const allButtons = await page.locator('button, .btn, input[type="button"], input[type="submit"]').count();
    console.log(`Total buttons found: ${allButtons}`);
    
    const visibleButtons = await page.locator('button:visible, .btn:visible').count();
    console.log(`Visible buttons: ${visibleButtons}`);
    
    const allInputs = await page.locator('input').count();
    console.log(`Total inputs: ${allInputs}`);
    
    const visibleInputs = await page.locator('input:visible').count();
    console.log(`Visible inputs: ${visibleInputs}`);
    
    // Check if we're still on login page
    if (currentUrl.includes('login')) {
      console.log('Still on login page - checking for errors');
      
      const errorElements = page.locator('.error, .alert, .message, .notification');
      const errorCount = await errorElements.count();
      
      if (errorCount > 0) {
        const errorText = await errorElements.first().textContent();
        console.log(`Error found: ${errorText}`);
      }
    } else {
      console.log('Successfully redirected from login page');
    }
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-after-login.png', fullPage: true });
    console.log('Screenshot saved as debug-after-login.png');
    
    // Basic success check - we should be logged in
    expect(currentUrl).not.toContain('login');
  });

  test('debug main page elements', async ({ page }) => {
    await page.goto(base);
    await page.waitForTimeout(2000);
    
    console.log('Analyzing main page structure...');
    
    // Check all classes on the page
    const allElements = await page.locator('*[class]').all();
    const classes = new Set();
    
    for (const element of allElements.slice(0, 50)) { // Check first 50 elements
      const className = await element.getAttribute('class');
      if (className) {
        className.split(' ').forEach(cls => classes.add(cls));
      }
    }
    
    console.log('Common CSS classes found:');
    Array.from(classes).slice(0, 20).forEach(cls => console.log(`  .${cls}`));
    
    // Check for upload-related elements
    const uploadElements = [
      'input[type="file"]',
      '[class*="upload"]',
      '[class*="drop"]',
      '[class*="drag"]',
      '[class*="file"]'
    ];
    
    for (const selector of uploadElements) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`Found ${count} elements matching: ${selector}`);
      }
    }
    
    // This test always passes - it's just for debugging
    expect(true).toBe(true);
  });

});