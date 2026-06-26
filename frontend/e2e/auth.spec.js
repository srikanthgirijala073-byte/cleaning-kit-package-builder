import { test, expect } from "@playwright/test";

const LOGIN_URL = "/login";
const DASHBOARD_URL = "/dashboard";

// Helper: Quick login via API
async function quickLogin(page, role, email, name) {
  const response = await page.request.post("http://localhost:5000/api/auth/quick-login", {
    data: { email, role, name },
  });
  const data = await response.json();
  await page.evaluate((tokenData) => {
    localStorage.setItem("user", JSON.stringify(tokenData));
  }, data);
  return data;
}

test.describe("Authentication Flows", () => {

  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("should display login page with all elements", async ({ page }) => {
    await page.goto(LOGIN_URL);
    await expect(page.locator("h1")).toContainText("Welcome Back");
    await expect(page.locator("input[name=email]")).toBeVisible();
    await expect(page.locator("input[name=password]")).toBeVisible();
    await expect(page.locator("button[type=submit]")).toContainText("Sign In");
  });

  test("should show Quick Demo Login buttons", async ({ page }) => {
    await page.goto("/portal");
    await expect(page.locator(".ops-role-card")).toHaveCount(4);
    await expect(page.locator(".ops-role-card").first()).toContainText("Admin");
  });

  test("should login with admin quick login", async ({ page }) => {
    const data = await quickLogin(page, "admin", "admin@example.com", "Admin Demo");
    expect(data.accessToken).toBeTruthy();
    expect(data.user.role).toBe("admin");
    await page.goto(DASHBOARD_URL);
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator("h1")).toContainText("Dashboard");
  });

  test("should login with customer quick login", async ({ page }) => {
    const data = await quickLogin(page, "customer", "customer@example.com", "Customer Demo");
    expect(data.accessToken).toBeTruthy();
    expect(data.user.role).toBe("customer");
    await page.goto(DASHBOARD_URL);
    await expect(page).toHaveURL(/dashboard/);
  });

  test("should login with manager quick login", async ({ page }) => {
    const data = await quickLogin(page, "manager", "manager@example.com", "Manager Demo");
    expect(data.accessToken).toBeTruthy();
    expect(data.user.role).toBe("manager");
    await page.goto(DASHBOARD_URL);
    await expect(page.locator("h1")).toContainText("Dashboard");
  });

  test("should login with staff quick login", async ({ page }) => {
    const data = await quickLogin(page, "staff", "staff@example.com", "Staff Demo");
    expect(data.accessToken).toBeTruthy();
    expect(data.user.role).toBe("staff");
    await page.goto(DASHBOARD_URL);
    await expect(page.locator("h1")).toContainText("Dashboard");
  });

  test("should redirect to login when accessing protected route unauthenticated", async ({ page }) => {
    await page.goto(DASHBOARD_URL);
    await expect(page).toHaveURL(/login/);
  });

  test("should have visible login form with proper labels", async ({ page }) => {
    await page.goto(LOGIN_URL);
    await expect(page.locator(".auth-remember")).toContainText("Remember me");
    await expect(page.locator(".auth-forgot")).toContainText("Forgot password?");
    await expect(page.locator(".customer-signup-btn")).toContainText("Create Account");
  });

  test("should show register link and navigate to register", async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.locator(".customer-signup-btn").click();
    await expect(page).toHaveURL(/register/);
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto(LOGIN_URL);
    await page.fill("input[name=email]", "invalid@test.com");
    await page.fill("input[name=password]", "wrongpass");
    await page.click("button[type=submit]");
    await expect(page.locator(".auth-alert.error")).toBeVisible({ timeout: 10000 });
  });

  test("should logout and redirect to login", async ({ page }) => {
    await quickLogin(page, "admin", "admin@example.com", "Admin Demo");
    await page.goto(DASHBOARD_URL);
    await expect(page).toHaveURL(/dashboard/);
    // Clear token to simulate logout
    await page.evaluate(() => localStorage.removeItem("user"));
    await page.goto(DASHBOARD_URL);
    await expect(page).toHaveURL(/login/);
  });

  test("should not show admin pages to customer role", async ({ page }) => {
    await quickLogin(page, "customer", "customer@example.com", "Customer Demo");
    await page.goto("/settings");
    await expect(page).toHaveURL(/unauthorized|login/);
  });
});
