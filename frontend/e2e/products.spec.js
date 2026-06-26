import { test, expect } from "@playwright/test";

async function quickLogin(page, role, email) {
  const r = await page.request.post("http://localhost:5000/api/auth/quick-login", {
    data: { email, role, name: role.charAt(0).toUpperCase() + role.slice(1) }
  });
  const d = await r.json();
  await page.evaluate((t) => localStorage.setItem("user", JSON.stringify(t)), d);
  return d;
}

test.describe("Products Management", () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
  });

  test("should display products page for admin", async ({ page }) => {
    await quickLogin(page, "admin", "admin@example.com");
    await page.goto("/products");
    await expect(page.locator("h1")).toContainText("Products Management");
  });

  test("should display products page for manager", async ({ page }) => {
    await quickLogin(page, "manager", "manager@example.com");
    await page.goto("/products");
    await expect(page.locator("h1")).toContainText("Products");
  });

  test("should display products page for staff", async ({ page }) => {
    await quickLogin(page, "staff", "staff@example.com");
    await page.goto("/products");
    await expect(page.locator("h1")).toContainText("Products");
  });

  test("should show search bar on products page", async ({ page }) => {
    await quickLogin(page, "admin", "admin@example.com");
    await page.goto("/products");
    await expect(page.locator("input[placeholder*=Search]").first()).toBeVisible();
  });

  test("should show stat cards on products page", async ({ page }) => {
    await quickLogin(page, "admin", "admin@example.com");
    await page.goto("/products");
    await expect(page.locator(".statistics-card").first()).toBeVisible();
  });

  test("should see Add Product button for admin", async ({ page }) => {
    await quickLogin(page, "admin", "admin@example.com");
    await page.goto("/products");
    await expect(page.getByText("Add Product").first()).toBeVisible();
  });

  test("should see export CSV button", async ({ page }) => {
    await quickLogin(page, "admin", "admin@example.com");
    await page.goto("/products");
    await expect(page.getByText("Export to CSV")).toBeVisible();
  });

  test("should see filter options on products page", async ({ page }) => {
    await quickLogin(page, "admin", "admin@example.com");
    await page.goto("/products");
    await expect(page.getByText("Show Favorites Only")).toBeVisible();
  });

  test("should redirect customer away from products", async ({ page }) => {
    await quickLogin(page, "customer", "customer@example.com");
    await page.goto("/products");
    await expect(page).toHaveURL(/unauthorized|login|dashboard/);
  });
});
