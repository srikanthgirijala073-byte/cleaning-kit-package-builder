const { verifyAccessToken, verifyRefreshToken } = require('../utils/tokens');

/**
 * Middleware: Authenticate JWT token
 * Attaches decoded user info to req.user
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access token is required' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired access token' });
  }

  req.user = decoded;
  next();
};

/**
 * Middleware: Optional authentication
 * Attaches user info if token is present, but doesn't block if missing
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
};

/**
 * Middleware: Role-based authorization
 * Checks if the authenticated user has one of the allowed roles
 * Must be used AFTER authenticate middleware
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: 'Access denied. You do not have the required permissions.',
        requiredRoles: allowedRoles,
        yourRole: userRole,
      });
    }

    next();
  };
};

/**
 * Middleware: Admin-only access
 */
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
};

module.exports = { authenticate, optionalAuth, authorize, adminOnly };
