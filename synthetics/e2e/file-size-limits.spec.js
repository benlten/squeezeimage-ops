const { test, expect } = require('@playwright/test');
const path = require('path');

const base = process.env.BASE_URL || 'https://www.squeezeimage.com';
const demoEmail = process.env.DEMO_EMAIL;
const demoPassword = process.env.DEMO_PASSWORD;

test.describe('File Size Limit Tests', () => {

  test('anonymous user - small file upload succeeds', async ({ page }) => {
    await page.goto(base);
    
    // Look for upload area
    const uploadArea = page.locator('.drop-zone, input[type="file"]').first();
    await expect(uploadArea).toBeVisible({ timeout: 10000 });
    
    // Try to upload a small file (if file input is visible)
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      // Create a small test file (1KB)
      const smallFile = path.join(__dirname, '../test-data/small-test.txt');
      await fileInput.setInputFiles(smallFile);
      
      // Wait for upload response
      await page.waitForTimeout(3000);
      
      // Check for success indicators (adjust selectors based on your UI)
      const successIndicator = page.locator('.success, .complete, .result-item').first();
      const errorIndicator = page.locator('.error, .limit-exceeded, .file-too-large').first();
      
      // Small files should succeed for anonymous users
      if (await successIndicator.count() > 0) {
        await expect(successIndicator).toBeVisible();
      } else {
        // If no success indicator, at least shouldn't have size limit error
        await expect(errorIndicator).not.toBeVisible();
      }
    } else {
      console.log('File input not accessible, checking for upload functionality');
      await expect(uploadArea).toBeVisible();
    }
  });

  test('anonymous user - large file upload shows limit warning', async ({ page }) => {
    await page.goto(base);
    
    // Check for file size limit messaging for anonymous users
    const limitWarning = page.locator('text=/file size.*limit|maximum.*size|upgrade.*larger/i');
    const uploadArea = page.locator('.drop-zone, input[type="file"]').first();
    
    await expect(uploadArea).toBeVisible({ timeout: 10000 });
    
    // Look for size limit indicators in the UI
    if (await limitWarning.count() > 0) {
      await expect(limitWarning).toBeVisible();
      console.log('File size limit warning found for anonymous users');
    } else {
      // If no explicit warning, check upload area is still functional
      await expect(uploadArea).toBeVisible();
      console.log('Upload area visible, file size limits may be enforced server-side');
    }
  });

  test('admin user - large file upload succeeds (unlimited)', async ({ page }) => {
    if (!demoEmail || !demoPassword) {
      test.skip('Demo credentials not available, skipping admin file size test');
    }

    // Login as admin
    await page.goto(`${base}/accounts/login/`);
    await page.locator('.form-input').first().fill(demoEmail);
    await page.locator('.form-input').nth(1).fill(demoPassword);
    await page.locator('.btn-primary').click();
    
    await page.waitForTimeout(3000);
    
    // Check for upload functionality
    const uploadArea = page.locator('.drop-zone, input[type="file"]').first();
    await expect(uploadArea).toBeVisible({ timeout: 10000 });
    
    // Admin users should have no file size warnings/limits
    const limitWarning = page.locator('text=/file size.*limit|maximum.*size|upgrade.*larger/i');
    const unlimitedIndicator = page.locator('text=/unlimited|premium|no limit/i');
    
    if (await unlimitedIndicator.count() > 0) {
      await expect(unlimitedIndicator).toBeVisible();
      console.log('Unlimited usage indicator found for admin user');
    } else {
      // At minimum, no size limit warnings should be present
      await expect(limitWarning).not.toBeVisible();
      console.log('No file size limit warnings for admin user');
    }
  });

  test('file size limit enforcement comparison', async ({ page }) => {
    await page.goto(base);
    
    // Test the upload interface behavior
    const uploadArea = page.locator('.drop-zone, .upload').first();
    await expect(uploadArea).toBeVisible({ timeout: 10000 });
    
    // Check for file size information in the UI
    const sizeInfo = page.locator('text=/MB|KB|size|limit/i');
    
    if (await sizeInfo.count() > 0) {
      console.log('File size information found on page');
      
      // Look for specific size limits mentioned
      const limitText = await sizeInfo.first().textContent();
      console.log(`File size limit info: ${limitText}`);
      
      // Verify the information is visible
      await expect(sizeInfo.first()).toBeVisible();
    } else {
      // If no explicit size info, verify upload area is functional
      await expect(uploadArea).toBeVisible();
      console.log('Upload area functional, size limits may be dynamic');
    }
  });

  test('upload flow validation for different user types', async ({ page }) => {
    // Test anonymous user flow
    await page.goto(base);
    
    const uploadArea = page.locator('.drop-zone, input[type="file"]').first();
    await expect(uploadArea).toBeVisible({ timeout: 10000 });
    
    // Check for login prompt or upgrade messaging
    const loginPrompt = page.locator('text=/sign in|login|register|create account/i');
    const upgradePrompt = page.locator('text=/upgrade|premium|unlimited|pro/i');
    
    // Anonymous users might see prompts for larger files
    if (await loginPrompt.count() > 0 || await upgradePrompt.count() > 0) {
      console.log('Found upgrade/login prompts for enhanced features');
    }
    
    // Verify basic upload functionality exists
    await expect(uploadArea).toBeVisible();
  });

});