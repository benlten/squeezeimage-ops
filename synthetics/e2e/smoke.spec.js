
const { test, expect } = require('@playwright/test');

const base = process.env.BASE_URL || 'https://example.com';
const assertText = process.env.PW_ASSERT_TEXT || 'Example Domain';

test('homepage loads and shows expected text', async ({ page }) => {
  await page.goto(base, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toContainText(assertText);
});
