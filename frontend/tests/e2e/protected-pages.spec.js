const { test, expect } = require("@playwright/test");

const protectedPages = ["/dashboard", "/buy-data", "/wallet-funding", "/transactions", "/admin"];

for (const path of protectedPages) {
  test(`unauthenticated users are redirected from ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login/);
  });
}
