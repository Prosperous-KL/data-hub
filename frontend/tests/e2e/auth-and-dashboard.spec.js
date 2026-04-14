const { test, expect } = require("@playwright/test");

test("login page renders form and CTA", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Welcome to Prosperous Data Hub" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  await expect(page.getByText("Need an account?")).toBeVisible();
});

test("register page renders required fields", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Create Account" })).toBeVisible();
  await expect(page.getByPlaceholder("Full name")).toBeVisible();
  await expect(page.getByPlaceholder("Phone number")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sign up" })).toBeVisible();
});
