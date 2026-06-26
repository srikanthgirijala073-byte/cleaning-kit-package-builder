import { test, expect } from "@playwright/test";

async function quickLogin(page, role, email) {
  const r = await page.request.post("http://localhost:5000/api/auth/quick-login", {
    data: { email, role, name: role.charAt(0).toUpperCase() + role.slice(1) }
  });
  const d = await r.json();
  await page.evaluate((t) => localStorage.setItem("user", JSON.stringify(t)), d);
  return d;
}

test.describe("Orders Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
  });

  test("should display orders page for admin", async ({ page }) => {
    await quickLogin(page, "admin", "admin@example.com");
    await page.goto("/orders");
    await expect(page.locator("h1")).toContainText("Orders Management");
  });

  test("should display orders page for staff", async ({ page }) => {
    await quickLogin(page, "staff", "staff@example.com");
    await page.goto("/orders");
    await expect(page.locator("h1")).toContainText("Orders");
  });

  test("should show search bar on orders page", async ({ page }) => {
    await quickLogin(page, "admin", "admin@example.com");
    await page.goto("/orders");
    await expect(page.locator("input[placeholder*=Search]").first()).toBeVisible();
  });

  test("should show status filter on orders page", async ({ page }) => {
    await quickLogin(page, "admin", "admin@example.com");
    await page.goto("/orders");
    await expect(page.getByText("All Statuses")).toBeVisible();
  });

  test("should show facility type filter", async ({ page }) => {
    await quickLogin(page, "admin", "admin@example.com");
    await page.goto("/orders");
    await expect(page.getByText("Facility Type")).toBeVisible();
  });

  test("should show date range filters", async ({ page }) => {
    await quickLogin(page, "admin", "admin@example.com");
    await page.goto("/orders");
    await expect(page.getByText("Start Date")).toBeVisible();
    await expect(page.getByText("End Date")).toBeVisible();
  });

  test("should show export button on orders", async ({ page }) => {
    await quickLogin(page, "admin", "admin@example.com");
    await page.goto("/orders");
    await expect(page.getByText("Export Dataset")).toBeVisible();
  });

  test("should redirect customer from orders page", async ({ page }) => {
    await quickLogin(page, "customer", "customer@example.com");
    await page.goto("/orders");
    await expect(page).toHaveURL(/unauthorized|login|dashboard/);
  });
});
