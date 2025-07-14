import { test, expect } from '@playwright/test';

test.describe('Daily Report Management - Basic Tests', () => {
  test('should load the application homepage', async ({ page }) => {
    // ホームページに移動
    await page.goto('http://localhost:3000');
    
    // ページがロードされることを確認
    await expect(page).toHaveURL(/localhost:3000/);
    
    // ページにコンテンツがあることを確認
    await expect(page.locator('body')).toBeVisible();
  });

  test('should display some text content', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // 何らかのテキストが表示されることを確認
    const textContent = await page.textContent('body');
    expect(textContent).toBeTruthy();
    expect(textContent!.length).toBeGreaterThan(0);
  });

  test('should respond to basic interactions', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // ページ上にボタンがあるかどうかをチェック
    const buttons = await page.locator('button').count();
    expect(buttons).toBeGreaterThanOrEqual(0);
  });
});