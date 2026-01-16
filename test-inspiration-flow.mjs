import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const page = await browser.newPage();
  
  try {
    console.log('1. Navigating to login page...');
    await page.goto('https://images.sqmarchitects.com.au/login');
    await page.waitForLoadState('networkidle');
    
    console.log('2. Entering password...');
    await page.fill('input[type="password"]', 'sqm2024images');
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');
    
    console.log('3. Looking for Inspiration Image toggle...');
    await page.waitForTimeout(2000);
    
    // Try to find the toggle/tab for Inspiration Image
    const inspirationButton = await page.locator('text=Inspiration Image').or(page.locator('button:has-text("Inspiration")')).first();
    
    if (await inspirationButton.isVisible()) {
      console.log('4. Found Inspiration toggle, clicking...');
      await inspirationButton.click();
      await page.waitForTimeout(1000);
      
      console.log('5. Taking screenshot...');
      await page.screenshot({ path: 'inspiration-ui-test.png', fullPage: true });
      
      console.log('6. Checking UI elements...');
      const elements = {
        dropzone: await page.locator('text=drag').or(page.locator('[type="file"]')).count() > 0,
        projectType: await page.locator('select').or(page.locator('text=Project Type')).count() > 0,
        suburb: await page.locator('text=Suburb').or(page.locator('text=Melbourne')).count() > 0,
        guidance: await page.locator('textarea').count() > 0,
        generateButton: await page.locator('button:has-text("Generate")').count() > 0
      };
      
      console.log('\n✅ Inspiration UI Test Results:');
      console.log('- Drag/Drop Zone:', elements.dropzone ? '✓ Found' : '✗ Not found');
      console.log('- Project Type:', elements.projectType ? '✓ Found' : '✗ Not found');
      console.log('- Suburb Dropdown:', elements.suburb ? '✓ Found' : '✗ Not found');
      console.log('- Guidance Textarea:', elements.guidance ? '✓ Found' : '✗ Not found');
      console.log('- Generate Button:', elements.generateButton ? '✓ Found' : '✗ Not found');
      console.log('\n📸 Screenshot saved to: inspiration-ui-test.png');
      
    } else {
      console.log('❌ Could not find Inspiration Image toggle');
      await page.screenshot({ path: 'after-login.png', fullPage: true });
      console.log('Screenshot of page after login saved to: after-login.png');
    }
    
  } catch (error) {
    console.error('Error during test:', error);
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
  } finally {
    await browser.close();
  }
})();
