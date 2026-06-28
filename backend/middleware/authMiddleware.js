const jwt = require('jsonwebtoken');
const { secret } = require('../config/jwt');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Require a Bearer token for protected routes
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Access denied. No authentication token provided.' });
    }

    const token = authHeader.split(' ')[1];

    // Reject dummy/placeholder tokens
    if (token === 'dummy-token') {
      return res.status(401).json({ message: 'Access denied. Invalid authentication token.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Access denied. Token has expired.', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ message: 'Access denied. Invalid authentication token.' });
    }

    // Support both {id} (authController) and {userId} (tokens.js) payload shapes
    const userId = decoded.id || decoded.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Access denied. Invalid token payload.' });
    }

    // Try DB lookup but gracefully fall back to token payload if DB unavailable
    let user;
    try {
      user = await User.findById(userId);
    } catch (dbErr) {
      console.warn('authMiddleware: DB lookup failed, using token payload:', dbErr.message);
      // Fallback: construct a minimal user object from decoded token
      user = {
        user_id: userId,
        email: decoded.email,
        role: decoded.role,
        name: decoded.name || decoded.email,
      };
    }

    if (!user) {
      // User deleted after token was issued — treat as unauthorized
      return res.status(401).json({ message: 'Access denied. User not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Authentication error.' });
  }
};

module.exports = { authMiddleware };
