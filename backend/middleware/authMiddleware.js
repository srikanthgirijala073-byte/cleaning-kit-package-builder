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

    const userId = decoded.id;
    if (!userId) {
      return res.status(401).json({ message: 'Access denied. Invalid token payload.' });
    }

    let user;
    try {
      user = await User.findById(userId);
    } catch (dbErr) {
      return res.status(500).json({ message: 'Server error while authenticating.' });
    }

    if (!user) {
      return res.status(401).json({ message: 'Access denied. User not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Authentication error.' });
  }
};

module.exports = { authMiddleware };
