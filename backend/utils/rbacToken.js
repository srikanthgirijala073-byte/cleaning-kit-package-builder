const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'cleaning_kit_builder_jwt_secret_key_2026';
const RBAC_JWT_EXPIRES_IN = process.env.RBAC_JWT_EXPIRES_IN || '1d';

/**
 * Generate a signed JWT for the RBAC auth system (admin / manager / staff).
 * Payload shape: { userId, email, role, ...extraClaims }
 *
 * `extraClaims` is optional and currently used to carry a staff member's
 * `department` (e.g. 'Warehouse', 'Sales') into the token, so downstream
 * middleware/controllers (dashboardController.getRoleBasedQueue) can
 * filter data by department without an extra DB lookup on every request.
 * Existing call sites that only pass {userId, email, role} are unaffected.
 */
const generateRbacToken = ({ userId, email, role, ...extraClaims }) => {
  return jwt.sign({ userId, email, role, ...extraClaims }, JWT_SECRET, {
    expiresIn: RBAC_JWT_EXPIRES_IN,
  });
};

/**
 * Verify a token and return its decoded payload, or null if invalid/expired.
 */
const verifyRbacToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = { generateRbacToken, verifyRbacToken, JWT_SECRET };
