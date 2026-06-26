import { test, expect } from "@playwright/test";

async function quickLogin(page, role, email) {
  const r = await page.request.post("http://localhost:5000/api/auth/quick-login", {
    data: { email, role, name: role.charAt(0).toUpperCase() + role.slice(1) }
  });
  const d = await r.json();
  await page.evaluate((t) => localStorage.setItem("user", JSON.stringify(t)), d);
  return d;
}

test.describe("Inventory Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
  });

  test("should display inventory page for admin", async ({ page }) => {
    await quickLogin(page, "admin", "admin@example.com");
    await page.goto("/inventory");
    await expect(page.locator("h1")).toContainText("Inventory Management");
  });

  test("should display inventory page for manager", async ({ page }) => {
    await quickLogin(page, "manager", "manager@example.com");
    await page.goto("/inventory");
    await expect(page.locator("h1")).toContainText("Inventory");
  });

  test("should show stat cards on inventory page", async ({ page }) => {
    await quickLogin(page, "admin", "admin@example.com");
    await page.goto("/inventory");
    await expect(page.locator(".statistics-card").first()).toBeVisible();
  });

  test("should show search bar on inventory", async ({ page }) => {
    await quickLogin(page, "admin", "admin@example.com");
    await page.goto("/inventory");
    await expect(page.locator("input[placeholder*=Search]").first()).toBeVisible();
  });

  test("should show inventory table", async ({ page }) => {
    await quickLogin(page, "admin", "admin@example.com");
    await page.goto("/inventory");
    await expect(page.locator("table")).toBeVisible({ timeout: 10000 });
  });

  test("should show table headers in inventory", async ({ page }) => {
    await quickLogin(page, "admin", "admin@example.com");
    await page.goto("/inventory");
    await expect(page.getByText("Product Name")).toBeVisible();
    await expect(page.getByText("Current Stock")).toBeVisible();
    await expect(page.getByText("Status")).toBeVisible();
  });

  test("should redirect staff from inventory", async ({ page }) => {
    await quickLogin(page, "staff", "staff@example.com");
    await page.goto("/inventory");
    await expect(page).toHaveURL(/unauthorized|login|dashboard/);
  });

  test("should redirect customer from inventory", async ({ page }) => {
    await quickLogin(page, "customer", "customer@example.com");
    await page.goto("/inventory");
    await expect(page).toHaveURL(/unauthorized|login|dashboard/);
  });
});
