const { verifyRbacToken } = require('../utils/rbacToken');
const { PORTALS, canAccessPortal } = require('../config/portalPermissions');

/**
 * protect (RBAC)
 * -----------------------------------------------------------------
 * Verifies the Bearer JWT issued by the Admin/Manager/Staff login
 * endpoints and attaches the decoded payload to req.rbacUser.
 *
 * This is intentionally separate from the existing customer-facing
 * `authenticate` middleware in middleware/auth.js, which uses a
 * different token/payload shape backed by MySQL.
 */
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'You are not authorized to access this page.',
    });
  }

  const decoded = verifyRbacToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'You are not authorized to access this page.',
    });
  }

  req.rbacUser = decoded; // { userId, email, role, iat, exp }
  next();
};

/**
 * authorize(...roles)
 * -----------------------------------------------------------------
 * Restricts a route to one or more roles. Must run after `protect`.
 * e.g. authorize('admin'), authorize('manager', 'admin')
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.rbacUser || !allowedRoles.includes(req.rbacUser.role)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this page.',
      });
    }
    next();
  };
};

/**
 * authorizePortal(portalKey)
 * -----------------------------------------------------------------
 * Portal-aware authorization, built on top of the same role matrix
 * documented in config/portalPermissions.js. Must run after `protect`.
 *
 * This is intentionally separate from authorize(...roles) above:
 * authorize() is a quick inline allow-list, while authorizePortal()
 * looks up the rule from the single shared permission matrix so every
 * portal's access rule lives in one auditable place (and the same
 * rule is reflected in docs/PORTAL_API_MAPPING.md).
 *
 * Example: a 'dealer' role is registered in the system, but is
 * deliberately excluded from PORTALS.CONTRACT_PRICING.allowedRoles.
 * A dealer must be upgraded to 'dealer_contract' (or be staff/manager/
 * admin) before they can view contract pricing.
 */
const authorizePortal = (portalKey) => {
  return (req, res, next) => {
    if (!req.rbacUser) {
      return res.status(401).json({
        success: false,
        message: 'You are not authorized to access this page.',
      });
    }

    const portal = PORTALS[portalKey];
    if (!portal) {
      // Fail closed: an unrecognized portal key is a server-side
      // configuration bug, not something a client should be able to
      // probe around.
      return res.status(500).json({
        success: false,
        message: 'Portal configuration error.',
      });
    }

    if (!canAccessPortal(req.rbacUser.role, portalKey)) {
      const role = req.rbacUser.role;
      const message =
        role === 'dealer' && portalKey === 'CONTRACT_PRICING'
          ? 'Dealers need contract-pricing access enabled on their account before viewing this page. Contact an administrator to upgrade your role.'
          : 'You are not authorized to access this page.';

      return res.status(403).json({ success: false, message });
    }

    next();
  };
};

module.exports = { protect, authorize, authorizePortal };
