const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: No user session found' });
    }

    const { role } = req.user;

    // Admin has full access to everything
    if (role === 'admin') {
      return next();
    }

    // Check if user's role is in the allowed list
    if (allowedRoles.includes(role)) {
      return next();
    }

    return res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
  };
};

module.exports = {
  roleMiddleware,
  rolesMiddleware: roleMiddleware
};
