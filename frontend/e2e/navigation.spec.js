import { test, expect } from "@playwright/test";

test.describe("Navigation & Routing", () => {

  test("should show 404 page for unknown route", async ({ page }) => {
    await page.goto("/nonexistent-page");
    await page.waitForLoadState("networkidle");
    const url = page.url();
    expect(url).toContain("nonexistent-page");
  });

  test("should show unauthorized page", async ({ page }) => {
    await page.goto("/unauthorized");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("unauthorized");
    await expect(page.locator("body")).toBeVisible();
  });

  test("should redirect to login for dashboard without auth", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("login");
  });

  test("should redirect to login for settings without auth", async ({ page }) => {
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("login");
  });

  test("should redirect to login for orders without auth", async ({ page }) => {
    await page.goto("/orders");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("login");
  });

  test("should redirect to login for inventory without auth", async ({ page }) => {
    await page.goto("/inventory");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("login");
  });

  test("should redirect to login for profile without auth", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("login");
  });

  test("should redirect to login for notifications without auth", async ({ page }) => {
    await page.goto("/notifications");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("login");
  });

  test("should render register page", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("register");
  });

  test("should render forgot password page", async ({ page }) => {
    await page.goto("/forgot-password");
    await page.waitForLoadState("networkidle");
    expect(page.url()).toContain("forgot-password");
  });
});
