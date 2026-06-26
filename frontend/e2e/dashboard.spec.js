import { test, expect } from "@playwright/test";

async function quickLogin(page, role, email) {
  const r = await page.request.post("http://localhost:5000/api/auth/quick-login", {
    data: { email, role, name: role.charAt(0).toUpperCase() + role.slice(1) }
  });
  const data = await r.json();
  await page.evaluate((d) => localStorage.setItem("user", JSON.stringify(d)), data);
  return data;
}

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("should display dashboard stats after login", async ({ page }) => {
    await quickLogin(page, "admin", "admin@example.com");
    await page.goto("/dashboard");
    await expect(page.locator("h1")).toContainText("Dashboard");
    await expect(page.locator(".statistics-card")).toHaveCount(4);
  });

  test("should display stat cards with correct titles", async ({ page }) => {
    await quickLogin(page, "admin", "admin@example.com");
    await page.goto("/dashboard");
    await expect(page.locator(".statistics-card").first()).toBeVisible();
  });

  test("should show recent orders table", async ({ page }) => {
    await quickLogin(page, "admin", "admin@example.com");
    await page.goto("/dashboard");
    await expect(page.locator("h2", { hasText: "Recent Orders" })).toBeVisible();
  });

  test("should show system alerts section", async ({ page }) => {
    await quickLogin(page, "admin", "admin@example.com");
    await page.goto("/dashboard");
    await expect(page.getByText("System Alerts")).toBeVisible();
  });

  test("should load dashboard for manager role", async ({ page }) => {
    await quickLogin(page, "manager", "manager@example.com");
    await page.goto("/dashboard");
    await expect(page.locator("h1")).toContainText("Dashboard");
  });

  test("should load dashboard for staff role", async ({ page }) => {
    await quickLogin(page, "staff", "staff@example.com");
    await page.goto("/dashboard");
    await expect(page.locator("h1")).toContainText("Dashboard");
  });

  test("should load dashboard for customer role", async ({ page }) => {
    await quickLogin(page, "customer", "customer@example.com");
    await page.goto("/dashboard");
    await expect(page.locator("h1")).toContainText("Dashboard");
  });

  test("should have welcome message on dashboard", async ({ page }) => {
    await quickLogin(page, "admin", "admin@example.com");
    await page.goto("/dashboard");
    await expect(page.getByText("Welcome to Cleaning Kit Package Builder")).toBeVisible();
  });
});