import { test, expect } from '@playwright/test';

test.describe('Dashboard Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'test@agricultura.com');
    await page.fill('input[name="password"]', 'test123');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3000/dashboard');
  });

  test('should display dashboard metrics', async ({ page }) => {
    await expect(page.locator('text=Total Fincas')).toBeVisible();
    await expect(page.locator('text=Total Lotes')).toBeVisible();
    await expect(page.locator('text=Rendimiento Promedio')).toBeVisible();
  });

  test('should navigate to reports page', async ({ page }) => {
    await page.click('a[href="/reportes"]');
    await expect(page).toHaveURL('http://localhost:3000/reportes');
    await expect(page.locator('text=Reportes Generados')).toBeVisible();
  });

  test('should generate operational report', async ({ page }) => {
    await page.click('a[href="/reportes"]');
    await page.click('button:has-text("Generar Reporte Operacional")');
    await page.fill('input[name="startDate"]', '2024-01-01');
    await page.fill('input[name="endDate"]', '2024-12-31');
    await page.click('button:has-text("Generar")');
    
    await expect(page.locator('text=Reporte generado exitosamente')).toBeVisible();
    await expect(page.locator('a:has-text("Descargar PDF")')).toBeVisible();
  });

  test('should view alerts', async ({ page }) => {
    await page.click('a[href="/dashboard"]');
    await expect(page.locator('.alerts-section')).toBeVisible();
    
    const unreadAlerts = await page.locator('.alert-item.unread').count();
    if (unreadAlerts > 0) {
      await page.click('.alert-item:first-child button:has-text("Marcar como leída")');
      await expect(page.locator('.alert-item:first-child')).not.toHaveClass(/unread/);
    }
  });
});
