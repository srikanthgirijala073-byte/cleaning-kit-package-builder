import { test, expect } from "@playwright/test";

async function quickLogin(page, role, email) {
  const r = await page.request.post("http://localhost:5000/api/auth/quick-login", {
    data: { email, role, name: role.charAt(0).toUpperCase() + role.slice(1) }
  });
  const d = await r.json();
  await page.evaluate((t) => localStorage.setItem("user", JSON.stringify(t)), d);
  return d;
}

test.describe("Kit Builder", () => {
  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear());
  });

  test("should display Kit Builder page for customer", async ({ page }) => {
    await quickLogin(page, "customer", "customer@example.com");
    await page.goto("/kit-builder");
    await expect(page.locator("h1")).toContainText("Cleaning Kit Package Builder");
  });

  test("should show Manual Package Builder tab by default", async ({ page }) => {
    await quickLogin(page, "customer", "customer@example.com");
    await page.goto("/kit-builder");
    await expect(page.getByText("Manual Package Builder")).toBeVisible();
  });

  test("should show Smart Assistant Wizard tab", async ({ page }) => {
    await quickLogin(page, "customer", "customer@example.com");
    await page.goto("/kit-builder");
    await expect(page.getByText("Smart Assistant Wizard")).toBeVisible();
  });

  test("should show product search bar in kit builder", async ({ page }) => {
    await quickLogin(page, "customer", "customer@example.com");
    await page.goto("/kit-builder");
    await expect(page.locator("input[placeholder*=Search]").first()).toBeVisible();
  });

  test("should show selected package section", async ({ page }) => {
    await quickLogin(page, "customer", "customer@example.com");
    await page.goto("/kit-builder");
    await expect(page.getByText("Selected Package Products")).toBeVisible();
  });

  test("should show empty cart message initially", async ({ page }) => {
    await quickLogin(page, "customer", "customer@example.com");
    await page.goto("/kit-builder");
    await expect(page.getByText("No products added to the package yet.")).toBeVisible();
  });

  test("should switch to Smart Assistant tab", async ({ page }) => {
    await quickLogin(page, "customer", "customer@example.com");
    await page.goto("/kit-builder");
    await page.getByText("Smart Assistant Wizard").click();
    await expect(page.getByText("Generate Smart Cleaning Package")).toBeVisible();
  });

  test("should show facility type dropdown", async ({ page }) => {
    await quickLogin(page, "customer", "customer@example.com");
    await page.goto("/kit-builder");
    await page.getByText("Smart Assistant Wizard").click();
    await expect(page.getByText("Facility Type")).toBeVisible();
    await expect(page.getByText("Facility Scale")).toBeVisible();
  });

  test("should show Kit Builder for staff role", async ({ page }) => {
    await quickLogin(page, "staff", "staff@example.com");
    await page.goto("/kit-builder");
    await expect(page.locator("h1")).toContainText("Cleaning Kit Package Builder");
  });

  test("should show Kit Builder for admin role", async ({ page }) => {
    await quickLogin(page, "admin", "admin@example.com");
    await page.goto("/kit-builder");
    await expect(page.locator("h1")).toContainText("Cleaning Kit Package Builder");
  });
});
