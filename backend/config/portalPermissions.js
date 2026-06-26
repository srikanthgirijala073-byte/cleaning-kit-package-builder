/**
 * portalPermissions.js
 * -----------------------------------------------------------------
 * Single source of truth for "Step 1: Data Entry (Completing the
 * Portals)". Each entry below documents:
 *   - which HTTP endpoint backs a given B2B portal screen
 *   - which Sequelize/MySQL models the endpoint reads or writes
 *   - which RBAC roles are allowed to call it
 *
 * This file is consumed by:
 *   - middleware/rbacAuth.js  (authorizePortal middleware)
 *   - docs/PORTAL_API_MAPPING.md (human-readable mirror of this table)
 *
 * Keeping the permission matrix here (instead of scattered inline
 * role checks) means the access rules for every portal can be
 * audited and changed in one place.
 */

// Roles currently issued by the RBAC login system (utils/rbacToken.js).
// 'dealer' and 'dealer_contract' are not wired to a login screen yet
// (see RBAC_SETUP.md / PORTAL_API_MAPPING.md for the follow-up), but the
// permission matrix already supports them so the Contract Pricing
// validation rule can be demonstrated and tested today.
const KNOWN_ROLES = ['admin', 'manager', 'staff', 'dealer', 'dealer_contract'];

const PORTALS = {
  BULK_ORDER: {
    method: 'POST',
    path: '/api/bulk-order',
    description: 'Bulk Order Portal — places a single order containing many line items at once.',
    models: ['Order', 'OrderItem', 'Product'],
    // Plain dealers may place bulk orders; only internal staff+ roles can
    // place them on someone else's behalf without restriction.
    allowedRoles: ['admin', 'manager', 'staff', 'dealer', 'dealer_contract'],
  },
  CONTRACT_PRICING: {
    method: 'GET',
    path: '/api/contract-pricing/:customerId',
    description: 'Contract Pricing screen — returns negotiated/tiered pricing for a specific customer.',
    models: ['Customer', 'Product', 'Order'],
    // A plain 'dealer' is intentionally NOT in this list. Dealers must be
    // upgraded to 'dealer_contract' (or be staff/manager/admin) before they
    // can view contract pricing. See authorizePortal() in rbacAuth.js.
    allowedRoles: ['admin', 'manager', 'dealer_contract'],
  },
  FACILITY_BUNDLE_PREVIEW: {
    method: 'GET',
    path: '/api/facility-bundle/preview',
    description: 'Cleaning Kit Workflow — previews the auto-bundled product kit for a facility type/size before an order is created.',
    models: ['Product'],
    allowedRoles: ['admin', 'manager', 'staff', 'dealer', 'dealer_contract'],
  },
  RBAC_DASHBOARD_QUEUE: {
    method: 'GET',
    path: '/api/rbac-dashboard/my-queue',
    description: 'Role-aware dashboard queue — returns the subset of orders relevant to the signed-in role/department.',
    models: ['Order', 'AuditLog'],
    allowedRoles: ['admin', 'manager', 'staff'],
  },
};

/**
 * canAccessPortal(role, portalKey)
 * Returns true/false. Unknown portal keys always deny (fail closed).
 */
function canAccessPortal(role, portalKey) {
  const portal = PORTALS[portalKey];
  if (!portal) return false;
  return portal.allowedRoles.includes(role);
}

module.exports = { PORTALS, KNOWN_ROLES, canAccessPortal };
