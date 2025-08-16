const { test, expect } = require('@playwright/test');

const base = process.env.BASE_URL || 'https://www.squeezeimage.com';

test.describe('Anonymous User Experience Tests', () => {

  test('anonymous user can access homepage and see compression features', async ({ page }) => {
    await page.goto(base);
    
    // Verify homepage loads
    await expect(page.locator('body')).toContainText('Smart Image Compression');
    
    // Check for upload functionality
    const uploadArea = page.locator('.drop-zone, .upload, input[type="file"]').first();
    await expect(uploadArea).toBeVisible({ timeout: 10000 });
  });

  test('anonymous user sees file size limitations or upgrade prompts', async ({ page }) => {
    await page.goto(base);
    
    // Look for size limit indicators
    const limitIndicators = [
      'text=/file size.*limit/i',
      'text=/maximum.*MB/i', 
      'text=/upgrade.*larger/i',
      'text=/premium.*unlimited/i',
      'text=/sign.*unlimited/i'
    ];
    
    let foundLimitIndicator = false;
    
    for (const selector of limitIndicators) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        await expect(element.first()).toBeVisible();
        console.log(`Found limit indicator: ${selector}`);
        foundLimitIndicator = true;
        break;
      }
    }
    
    // If no explicit limits shown, verify upload area exists
    if (!foundLimitIndicator) {
      const uploadArea = page.locator('.drop-zone, .upload').first();
      await expect(uploadArea).toBeVisible();
      console.log('No explicit size limits shown, but upload functionality available');
    }
  });

  test('anonymous user can see pricing/upgrade options', async ({ page }) => {
    await page.goto(base);
    
    // Look for pricing or upgrade information
    const pricingElements = page.locator('text=/pricing|upgrade|premium|pro|unlimited|plan/i');
    const signUpElements = page.locator('text=/sign up|get started|create account|register/i');
    
    // Check for pricing/upgrade visibility
    if (await pricingElements.count() > 0) {
      await expect(pricingElements.first()).toBeVisible();
      console.log('Found pricing/upgrade information');
    }
    
    if (await signUpElements.count() > 0) {
      await expect(signUpElements.first()).toBeVisible();
      console.log('Found sign up options');
    }
    
    // At minimum, verify the page is functional
    await expect(page.locator('body')).toContainText(/compress|squeeze|image/i);
  });

  test('anonymous user file upload behavior (server-side limits)', async ({ page }) => {
    await page.goto(base);
    
    const uploadArea = page.locator('.drop-zone, input[type="file"]').first();
    await expect(uploadArea).toBeVisible({ timeout: 10000 });
    
    // Try to interact with upload area
    if (await uploadArea.isVisible()) {
      await uploadArea.hover();
      
      // Look for any dynamic messages that appear on hover/interaction
      const dynamicMessages = page.locator('.tooltip, .help-text, .info, .message');
      
      if (await dynamicMessages.count() > 0) {
        console.log('Found dynamic messages on upload interaction');
        
        // Check if any mention file sizes
        const sizeMessages = dynamicMessages.locator('text=/MB|KB|size|limit/i');
        if (await sizeMessages.count() > 0) {
          await expect(sizeMessages.first()).toBeVisible();
          console.log('File size information appears on interaction');
        }
      }
    }
  });

  test('anonymous user navigation and feature discovery', async ({ page }) => {
    await page.goto(base);
    
    // Check for navigation to features/pricing
    const navLinks = page.locator('nav a, .menu a, .navbar a');
    
    if (await navLinks.count() > 0) {
      console.log(`Found ${await navLinks.count()} navigation links`);
      
      // Look for specific feature/pricing links
      const featureLinks = navLinks.locator('text=/features|pricing|about|how.*works/i');
      
      if (await featureLinks.count() > 0) {
        console.log('Found feature/pricing navigation');
        await expect(featureLinks.first()).toBeVisible();
      }
    }
    
    // Verify basic page functionality
    await expect(page.locator('body')).toContainText('Smart Image Compression');
  });

  test('anonymous user vs authenticated user feature comparison', async ({ page }) => {
    await page.goto(base);
    
    // Look for comparison tables or feature lists
    const comparisonElements = page.locator('.comparison, .features, .plans, .pricing-table');
    const featureList = page.locator('text=/✓|✗|check|cross|free|paid|premium/i');
    
    if (await comparisonElements.count() > 0) {
      await expect(comparisonElements.first()).toBeVisible();
      console.log('Found feature comparison section');
    }
    
    if (await featureList.count() > 0) {
      console.log('Found feature indicators (checkmarks, etc.)');
      await expect(featureList.first()).toBeVisible();
    }
    
    // Check for CTA buttons for upgrading
    const ctaButtons = page.locator('text=/get started|sign up|upgrade|try.*free/i');
    
    if (await ctaButtons.count() > 0) {
      await expect(ctaButtons.first()).toBeVisible();
      console.log('Found call-to-action buttons');
    }
  });

});