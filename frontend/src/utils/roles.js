/**
 * Role-Based Access Control (RBAC) Configuration
 *
 * Defines role permissions for the four user tiers:
 * - admin:    Full access to everything
 * - manager:  Products, Orders, Inventory, Reports, Dashboard, Analytics
 * - staff:    Products, Orders, Dashboard (read-only on most actions)
 * - customer: Kit Builder, Orders (their own), Dashboard
 */

export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  STAFF: "staff",
  CUSTOMER: "customer",
  SALESMAN: "salesman",
  DELIVERY: "delivery",
  ACCOUNTS: "accounts",
  COMPLIANCE: "compliance",
  DEALER: "dealer",
  DEALER_CONTRACT: "dealer_contract",
};

/**
 * Route-based permissions.
 * Each key is a route path. Each value is an array of roles allowed.
 * Use "*" as a wildcard to allow all authenticated roles.
 */
export const ROUTE_PERMISSIONS = {
  "/dashboard": "*",
  "/kit-builder": ["customer", "staff", "manager", "admin"],
  "/orders": ["staff", "manager", "admin"],
  "/products": ["staff", "manager", "admin"],
  "/inventory": ["manager", "admin"],
  "/customers": ["manager", "admin"],
  "/reports": ["manager", "admin"],
  "/analytics": ["manager", "admin"],
  "/history": ["manager", "admin"],
  "/notifications": "*",
  "/settings": ["admin"],
  "/profile": "*",
  "/security-settings": "*",
  "/login-history": "*",
  "/b2b/quotations": ["staff", "manager", "admin"],
  "/b2b/delivery-tracker": ["staff", "manager", "admin"],
  "/b2b/visits": ["staff", "manager", "admin"],
  "/b2b/reorders": ["manager", "admin"],
  "/b2b/contracts": ["manager", "admin", "accounts"],
  "/b2b/compliance": ["manager", "admin", "compliance"],
  "/b2b/catalog": "*",
  "/b2b/bulk-orders": ["staff", "manager", "admin", "dealer"],
  "/b2b/warehouse": ["manager", "admin"],
  "/salesman/dashboard": ["salesman", "manager", "admin"],
  "/delivery/dashboard": ["delivery", "manager", "admin"],
  "/accounts/dashboard": ["accounts", "manager", "admin"],
  "/compliance-admin/dashboard": ["compliance", "manager", "admin"],
  "/dealer/dashboard": ["dealer", "dealer_contract"],
};

/**
 * Action-based permissions for within-page operations.
 */
export const ACTION_PERMISSIONS = {
  "products.create": ["admin", "manager"],
  "products.edit": ["admin", "manager"],
  "products.delete": ["admin"],
  "orders.create": ["customer", "staff", "manager", "admin"],
  "orders.edit": ["staff", "manager", "admin"],
  "orders.delete": ["admin"],
  "orders.update-status": ["staff", "manager", "admin"],
  "inventory.update": ["admin", "manager"],
  "customers.view": ["manager", "admin"],
  "customers.edit": ["admin"],
  "settings.edit": ["admin"],
  "users.manage": ["admin"],
};

/**
 * Sidebar menu items with their allowed roles.
 */
export const SIDEBAR_MENU_ITEMS = [
  { path: "/dashboard", icon: "\ud83d\udcca", title: "Dashboard", roles: "*" },
  { path: "/kit-builder", icon: "\ud83e\uddf9", title: "Kit Builder", roles: ["customer", "staff", "manager", "admin"] },
  { path: "/orders", icon: "\ud83d\udce6", title: "Orders", roles: ["staff", "manager", "admin"] },
  { path: "/products", icon: "\ud83e\uddf4", title: "Products", roles: ["staff", "manager", "admin"] },
  { path: "/inventory", icon: "\ud83d\udccb", title: "Inventory", roles: ["manager", "admin"] },
  { path: "/customers", icon: "\ud83d\udc65", title: "Customers", roles: ["manager", "admin"] },
  { path: "/b2b/quotations", icon: "\ud83d\udce9", title: "Quotations", roles: ["staff", "manager", "admin"] },
  { path: "/b2b/delivery-tracker", icon: "\ud83d\ude9a", title: "Deliveries", roles: ["staff", "manager", "admin"] },
  { path: "/b2b/visits", icon: "\ud83d\udc64", title: "Sales Visits", roles: ["staff", "manager", "admin"] },
  { path: "/b2b/reorders", icon: "\ud83d\udce6", title: "Reorders", roles: ["manager", "admin"] },
  { path: "/b2b/contracts", icon: "\ud83d\udcd1", title: "Contracts", roles: ["manager", "admin"] },
  { path: "/b2b/compliance", icon: "\ud83d\udee1\ufe0f", title: "Compliance", roles: ["manager", "admin", "compliance"] },
  { path: "/b2b/catalog",   icon: "\ud83c\udfea", title: "Product Catalog", roles: "*" },
  { path: "/b2b/bulk-orders", icon: "\ud83d\udce6", title: "Bulk Orders", roles: ["staff", "manager", "admin", "dealer"] },
  { path: "/b2b/warehouse", icon: "\ud83c\udfed", title: "Warehouse", roles: ["manager", "admin"] },
  { path: "/salesman/dashboard",        icon: "\ud83d\udc64", title: "Salesman Portal",   roles: ["salesman"] },
  { path: "/delivery/dashboard",        icon: "\ud83d\ude9a", title: "Delivery Portal",   roles: ["delivery"] },
  { path: "/accounts/dashboard",        icon: "\ud83d\udcb0", title: "Accounts Portal",   roles: ["accounts"] },
  { path: "/compliance-admin/dashboard",icon: "\ud83d\udee1\ufe0f", title: "Compliance Portal", roles: ["compliance"] },
  { path: "/reports", icon: "\ud83d\udcc8", title: "Reports", roles: ["manager", "admin"] },
  { path: "/analytics", icon: "\ud83d\udcc9", title: "Analytics", roles: ["manager", "admin"] },
  { path: "/notifications", icon: "\ud83d\udd14", title: "Notifications", roles: "*" },
  { path: "/history", icon: "\ud83d\udcdd", title: "History", roles: ["manager", "admin"] },
  { path: "/settings", icon: "\u2699\ufe0f", title: "Settings", roles: ["admin"] },
];

/**
 * Check if a user role has permission for a given route.
 */
export const hasRoutePermission = (role, path) => {
  if (!role) return false;

  if (ROUTE_PERMISSIONS[path]) {
    const allowed = ROUTE_PERMISSIONS[path];
    if (allowed === "*") return true;
    return allowed.includes(role);
  }

  // Prefix match for dynamic routes (e.g., /details/:id)
  const matchingPrefix = Object.keys(ROUTE_PERMISSIONS)
    .filter((key) => key.includes(":"))
    .find((key) => {
      const prefix = key.split(":")[0];
      return path.startsWith(prefix);
    });

  if (matchingPrefix) {
    const allowed = ROUTE_PERMISSIONS[matchingPrefix];
    if (allowed === "*") return true;
    return allowed.includes(role);
  }

  return true;
};

/**
 * Check if a user role has permission for a given action.
 */
export const hasActionPermission = (role, action) => {
  if (!role) return false;
  const allowed = ACTION_PERMISSIONS[action];
  if (!allowed) return false;
  return allowed.includes(role);
};

export default ROLES;
