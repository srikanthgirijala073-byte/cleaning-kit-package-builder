const { expect } = require("@playwright/test");

const API_URL = "http://localhost:5000/api";

const QUICK_LOGIN_CREDENTIALS = {
  admin: { email: "admin@example.com", role: "admin", name: "Admin Demo" },
  manager: { email: "manager@example.com", role: "manager", name: "Manager Demo" },
  staff: { email: "staff@example.com", role: "staff", name: "Staff Demo" },
  customer: { email: "customer@example.com", role: "customer", name: "Customer Demo" },
};

async function quickLogin(page, role) {
  const creds = QUICK_LOGIN_CREDENTIALS[role];
  if (!creds) throw new Error("Unknown role: " + role);
  const r = await page.request.post(API_URL + "/auth/quick-login", {
    data: creds,
  });
  const data = await r.json();
  await page.evaluate((t) => localStorage.setItem("user", JSON.stringify(t)), data);
  return data;
}

module.exports = { quickLogin, QUICK_LOGIN_CREDENTIALS, API_URL };
