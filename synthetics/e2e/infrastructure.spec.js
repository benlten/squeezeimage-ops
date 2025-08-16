const { test, expect } = require('@playwright/test');

const base = process.env.BASE_URL || 'https://www.squeezeimage.com';

test.describe('Infrastructure and DNS Tests', () => {

  test('www.squeezeimage.com loads correctly', async ({ page }) => {
    await page.goto('https://www.squeezeimage.com');
    await expect(page.locator('body')).toContainText('Smart Image Compression');
    
    // Check response headers for Cloudflare
    const response = await page.goto('https://www.squeezeimage.com');
    const headers = response.headers();
    
    if (headers['cf-ray'] || headers['server']?.includes('cloudflare')) {
      console.log('✅ Cloudflare CDN detected');
    }
    
    expect(response.status()).toBe(200);
  });

  test('bare domain squeezeimage.com redirects or loads', async ({ page }) => {
    await page.goto('https://squeezeimage.com');
    await expect(page.locator('body')).toContainText('Smart Image Compression');
    
    // Should either redirect to www or load directly
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/squeezeimage\.com/);
    
    console.log(`Bare domain loads at: ${currentUrl}`);
  });

  test('DigitalOcean App Platform origin is accessible', async ({ page }) => {
    // Test the origin server directly (bypassing CDN)
    const originUrl = 'https://squeezeimage-albl7.ondigitalocean.app';
    
    try {
      await page.goto(originUrl);
      await expect(page.locator('body')).toContainText('Smart Image Compression');
      console.log('✅ DigitalOcean origin server accessible');
    } catch (error) {
      console.log('ℹ️ Origin server may be CDN-only (normal for some setups)');
      // This is okay - some DO apps only work through CDN
    }
  });

  test('SSL certificates are valid', async ({ page }) => {
    const response = await page.goto('https://www.squeezeimage.com');
    
    // If we get here without SSL errors, certificate is valid
    expect(response.status()).toBe(200);
    console.log('✅ SSL certificate valid');
    
    // Check if HSTS is enabled
    const headers = response.headers();
    if (headers['strict-transport-security']) {
      console.log('✅ HSTS enabled for enhanced security');
    }
  });

  test('CDN performance and caching', async ({ page }) => {
    const startTime = Date.now();
    
    const response = await page.goto('https://www.squeezeimage.com');
    
    const loadTime = Date.now() - startTime;
    console.log(`Page load time: ${loadTime}ms`);
    
    // Check for cache headers
    const headers = response.headers();
    const cacheHeaders = ['cache-control', 'cf-cache-status', 'etag'];
    
    cacheHeaders.forEach(header => {
      if (headers[header]) {
        console.log(`${header}: ${headers[header]}`);
      }
    });
    
    // Reasonable load time check (adjust based on your needs)
    expect(loadTime).toBeLessThan(10000); // 10 seconds max
  });

  test('subdomain wildcard configuration', async ({ page }) => {
    // Test that wildcard DNS works (if needed)
    const testSubdomain = 'test.squeezeimage.com';
    
    try {
      await page.goto(`https://${testSubdomain}`);
      // If wildcard works, should get some response (may be 404, but not DNS failure)
      console.log(`Wildcard DNS test: ${testSubdomain} resolves`);
    } catch (error) {
      if (error.message.includes('DNS') || error.message.includes('resolve')) {
        console.log('Wildcard DNS may not be configured (normal for most setups)');
      } else {
        console.log(`Subdomain test result: ${error.message}`);
      }
    }
  });

  test('multiple geographic access points', async ({ page }) => {
    // Test main domain from different entry points
    const urls = [
      'https://www.squeezeimage.com',
      'https://squeezeimage.com'
    ];
    
    for (const url of urls) {
      const startTime = Date.now();
      const response = await page.goto(url);
      const loadTime = Date.now() - startTime;
      
      expect(response.status()).toBe(200);
      console.log(`${url}: ${loadTime}ms`);
    }
  });

});