import { test, expect } from '@playwright/test';

test.describe('Lottie Lifecycle Manager', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://reinocapital.webflow.io/taxas-app');

    // Wait for the page to load and modules to initialize
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('should initialize Lottie Lifecycle Manager', async ({ page }) => {
    // Check if the Lottie Lifecycle Manager is available globally
    const isManagerAvailable = await page.evaluate(() => {
      return typeof window.ReinoLottieLifecycleManager !== 'undefined';
    });

    expect(isManagerAvailable).toBe(true);
  });

  test('should detect step 0 as initial state', async ({ page }) => {
    // Check if we start on step 0
    const initialStep = await page.evaluate(() => {
      return window.ReinoLottieLifecycleManager?.getCurrentStep();
    });

    expect(initialStep).toBe(0);

    // Check if animations are active on step 0
    const isOnStep0 = await page.evaluate(() => {
      return window.ReinoLottieLifecycleManager?.isOnStep0();
    });

    expect(isOnStep0).toBe(true);
  });

  test('should have Lottie animations visible on step 0', async ({ page }) => {
    // Check if Lottie animation elements exist
    const lottieElements = await page.locator(
      '.animation-source-wrapper [data-animation-type="lottie"]'
    );
    const count = await lottieElements.count();

    expect(count).toBeGreaterThan(0);

    // Check if at least one animation is visible
    const firstAnimation = lottieElements.first();
    await expect(firstAnimation).toBeVisible();
  });

  test('should destroy animations when navigating away from step 0', async ({ page }) => {
    // Navigate to step 1 by clicking the "Vamos começar" button
    const startButton = page.locator('text=Vamos começar');
    await startButton.click();

    // Wait for navigation to complete
    await page.waitForTimeout(1000);

    // Check if we're no longer on step 0
    const currentStep = await page.evaluate(() => {
      return window.ReinoLottieLifecycleManager?.getCurrentStep();
    });

    expect(currentStep).toBe(1);

    // Check if step 0 is no longer active
    const isOnStep0 = await page.evaluate(() => {
      return window.ReinoLottieLifecycleManager?.isOnStep0();
    });

    expect(isOnStep0).toBe(false);

    // Check animation status
    const status = await page.evaluate(() => {
      return window.ReinoLottieLifecycleManager?.getAnimationStatus();
    });

    expect(status.currentStep).toBe(1);
    expect(status.isStep0Active).toBe(false);
  });

  test('should recreate animations when returning to step 0', async ({ page }) => {
    // First navigate away from step 0
    const startButton = page.locator('text=Vamos começar');
    await startButton.click();
    await page.waitForTimeout(1000);

    // Then navigate back to step 0 using progress bar
    const step0Button = page.locator('[section-step="0"], .section-indicator').first();
    if (await step0Button.isVisible()) {
      await step0Button.click();
      await page.waitForTimeout(1000);

      // Check if we're back on step 0
      const currentStep = await page.evaluate(() => {
        return window.ReinoLottieLifecycleManager?.getCurrentStep();
      });

      expect(currentStep).toBe(0);

      // Check if animations are active again
      const isOnStep0 = await page.evaluate(() => {
        return window.ReinoLottieLifecycleManager?.isOnStep0();
      });

      expect(isOnStep0).toBe(true);
    }
  });

  test('should provide correct animation status', async ({ page }) => {
    const status = await page.evaluate(() => {
      return window.ReinoLottieLifecycleManager?.getAnimationStatus();
    });

    expect(status).toHaveProperty('currentStep');
    expect(status).toHaveProperty('isStep0Active');
    expect(status).toHaveProperty('totalAnimations');
    expect(status).toHaveProperty('activeInstances');

    expect(typeof status.currentStep).toBe('number');
    expect(typeof status.isStep0Active).toBe('boolean');
    expect(typeof status.totalAnimations).toBe('number');
    expect(typeof status.activeInstances).toBe('number');
  });

  test('should integrate with step navigation system', async ({ page }) => {
    // Check if step navigation system is available
    const isStepSystemAvailable = await page.evaluate(() => {
      return typeof window.ReinoStepNavigationProgressSystem !== 'undefined';
    });

    expect(isStepSystemAvailable).toBe(true);

    // Check if both systems report the same current step
    const [lottieStep, navigationStep] = await page.evaluate(() => {
      return [
        window.ReinoLottieLifecycleManager?.getCurrentStep(),
        window.ReinoStepNavigationProgressSystem?.getCurrentStep(),
      ];
    });

    expect(lottieStep).toBe(navigationStep);
  });

  test('should handle manual force destroy and recreate', async ({ page }) => {
    // Test manual force destroy
    await page.evaluate(() => {
      window.ReinoLottieLifecycleManager?.forceDestroy();
    });

    const statusAfterDestroy = await page.evaluate(() => {
      return window.ReinoLottieLifecycleManager?.getAnimationStatus();
    });

    expect(statusAfterDestroy.isStep0Active).toBe(false);

    // Test manual force recreate
    await page.evaluate(() => {
      window.ReinoLottieLifecycleManager?.forceRecreate();
    });

    const statusAfterRecreate = await page.evaluate(() => {
      return window.ReinoLottieLifecycleManager?.getAnimationStatus();
    });

    expect(statusAfterRecreate.isStep0Active).toBe(true);
  });
});
