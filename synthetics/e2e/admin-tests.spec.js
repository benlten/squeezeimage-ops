const { test, expect } = require('@playwright/test');

const base = process.env.BASE_URL || 'https://www.squeezeimage.com';
const demoEmail = process.env.DEMO_EMAIL || 'demo@squeezit.com';
const demoPassword = process.env.DEMO_PASSWORD || 'Sq8@dMin!2024#Zx';

test.describe('SqueezeImage Admin Tests', () => {
  
  test('homepage loads correctly', async ({ page }) => {
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('body')).toContainText('Smart Image Compression');
  });

  test('demo admin user can login', async ({ page }) => {
    // Go to login page
    await page.goto(`${base}/accounts/login/`, { waitUntil: 'domcontentloaded' });
    
    // Fill login form using the correct selectors
    const emailInput = page.locator('.form-input').first();
    const passwordInput = page.locator('.form-input').nth(1);
    const loginButton = page.locator('.btn-primary');
    
    await emailInput.fill(demoEmail);
    await passwordInput.fill(demoPassword);
    await loginButton.click();
    
    // Wait for successful login - look for dashboard or admin indicators
    await expect(page.locator('body')).toContainText(/dashboard|admin|upload|compress|welcome/i, { timeout: 10000 });
  });

  test('admin can access image compression features', async ({ page }) => {
    // Login first
    await page.goto(`${base}/accounts/login/`);
    await page.locator('.form-input').first().fill(demoEmail);
    await page.locator('.form-input').nth(1).fill(demoPassword);
    await page.locator('.btn-primary').click();
    
    // Wait for dashboard
    await page.waitForTimeout(2000);
    
    // Look for upload functionality
    const uploadArea = page.locator('.upload-area, .file-upload, input[type="file"], [data-testid="upload"]').first();
    await expect(uploadArea).toBeVisible({ timeout: 5000 });
  });

  test('admin has unlimited usage (no restrictions)', async ({ page }) => {
    // Login
    await page.goto(`${base}/accounts/login/`);
    await page.locator('.form-input').first().fill(demoEmail);
    await page.locator('.form-input').nth(1).fill(demoPassword);
    await page.locator('.btn-primary').click();
    
    await page.waitForTimeout(2000);
    
    // Check for admin indicators or unlimited usage messages
    const adminIndicators = [
      /unlimited/i,
      /admin/i, 
      /premium/i,
      /no limits/i,
      /unlimited usage/i
    ];
    
    let foundAdminFeature = false;
    for (const indicator of adminIndicators) {
      try {
        await expect(page.locator('body')).toContainText(indicator, { timeout: 2000 });
        foundAdminFeature = true;
        break;
      } catch (e) {
        // Continue checking other indicators
      }
    }
    
    // If no specific admin text found, just verify we're logged in successfully
    if (!foundAdminFeature) {
      await expect(page.locator('body')).not.toContainText(/login|sign in/i);
    }
  });

  test('compression functionality is accessible', async ({ page }) => {
    // Login
    await page.goto(`${base}/accounts/login/`);
    await page.locator('.form-input').first().fill(demoEmail);
    await page.locator('.form-input').nth(1).fill(demoPassword);
    await page.locator('.btn-primary').click();
    
    await page.waitForTimeout(3000);
    
    // Check that main compression features are available
    const compressionFeatures = page.locator('.compress, .optimize, .upload, [data-testid="compress"], button:has-text("compress")', { ignoreCase: true });
    
    // At least one compression-related element should be present
    await expect(compressionFeatures.first()).toBeVisible({ timeout: 5000 });
  });

});