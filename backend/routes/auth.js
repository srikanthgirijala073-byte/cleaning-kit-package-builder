const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const { query, getOne } = require('../config/db');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateRandomToken,
  generateOTP,
  generateTempToken,
} = require('../utils/tokens');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendLoginNotificationEmail,
  sendOTPEmail,
} = require('../utils/email');
const { logAuditEvent } = require('../utils/logger');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { parseUserAgent } = require('../utils/helpers');

// =======================
// Demo users fallback — used when MySQL DB is offline (e.g. on Render free tier without DB)
// =======================
const DEMO_USERS = {
  'admin@example.com':    { user_id: 1, name: 'Admin User',    email: 'admin@example.com',    role: 'admin',    email_verified: true, is_active: true, password: 'admin123' },
  'manager@example.com':  { user_id: 2, name: 'Manager User',  email: 'manager@example.com',  role: 'manager',  email_verified: true, is_active: true, password: 'manager123' },
  'staff@example.com':    { user_id: 3, name: 'Staff User',    email: 'staff@example.com',    role: 'staff',    email_verified: true, is_active: true, password: 'staff123' },
  'customer@example.com': { user_id: 4, name: 'Customer User', email: 'customer@example.com', role: 'customer', email_verified: true, is_active: true, password: 'customer123' },
};

// =======================
// POST /api/auth/register
// =======================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, address, recaptchaToken } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existing = await getOne('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user (default role: customer)
    const result = await query(
      'INSERT INTO users (name, email, password, phone, address, role, email_verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone || '', address || '', 'customer', true]
    );

    const userId = result.insertId;

    // Generate email verification token
    const verificationToken = generateRandomToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await query(
      'INSERT INTO email_verification_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [userId, verificationToken, expiresAt]
    );

    // Send verification email
    const user = { name, email, user_id: userId };
    await sendVerificationEmail(user, verificationToken);

    // Log audit event
    await logAuditEvent(userId, 'REGISTER', 'New account created', req.ip);

    res.status(201).json({
      message: 'Registration successful! Please check your email to verify your account.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

// =======================
// POST /api/auth/login
// =======================
router.post('/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    let user = null;

    // Try live DB
    try {
      user = await getOne('SELECT * FROM users WHERE email = ?', [email]);
    } catch (dbErr) {
      console.warn('Login DB error, checking demo users:', dbErr.message);
      // Check against hardcoded demo users when DB is offline
      const demoMatch = DEMO_USERS && DEMO_USERS[email];
      if (demoMatch && demoMatch.password === password) {
        const accessToken = generateAccessToken(demoMatch);
        const refreshToken = generateRefreshToken(demoMatch);
        const { password: _p, ...userData } = demoMatch;
        return res.json({
          accessToken, token: accessToken, refreshToken, historyId: null, user: userData, _demo: true,
        });
      }
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'Account is deactivated. Contact administrator.' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await logAuditEvent(user.user_id, 'LOGIN_FAILED', 'Invalid password', req.ip);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if 2FA is enabled
    if (user.two_factor_enabled) {
      const otpCode = generateOTP();
      const tempToken = generateTempToken();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await query(
        'INSERT INTO otp_codes (user_id, code, temp_token, expires_at) VALUES (?, ?, ?, ?)',
        [user.user_id, otpCode, tempToken, expiresAt]
      );

      await sendOTPEmail(user, otpCode);

      await logAuditEvent(user.user_id, '2FA_REQUIRED', 'OTP code sent', req.ip);

      return res.json({
        twoFactorRequired: true,
        tempToken,
        message: 'A verification code has been sent to your email.',
      });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Parse user agent to prevent database data truncation errors (ER_DATA_TOO_LONG)
    const ua = req.headers['user-agent'] || 'Unknown';
    const { browser, device } = parseUserAgent(ua);

    // Store refresh token (table is user_sessions per schema)
    const refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await query(
      'INSERT INTO user_sessions (user_id, refresh_token, device_name, browser, ip_address, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
      [user.user_id, refreshToken, device, browser, req.ip || '127.0.0.1', refreshExpires]
    );

    // Record login history
    const loginResult = await query(
      'INSERT INTO login_history (user_id, ip_address, device_name, browser) VALUES (?, ?, ?, ?)',
      [
        user.user_id,
        req.ip || '127.0.0.1',
        device,
        browser,
      ]
    );
    const historyId = loginResult.insertId;

    // Update last login timestamp
    await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?', [user.user_id]);

    // Send login notification email if enabled
    if (user.login_notifications_enabled) {
      const loginInfo = {
        time: new Date().toLocaleString(),
        device: device,
        browser: browser,
        ip: req.ip || '127.0.0.1',
      };
      // Fire and forget - don't block login response
      sendLoginNotificationEmail(user, loginInfo).catch(err =>
        console.error('Login notification email failed:', err.message)
      );
    }

    await logAuditEvent(user.user_id, 'LOGIN_SUCCESS', 'User logged in successfully', req.ip);

    // Return user data (excluding password)
    const { password: _, ...userData } = user;

    res.json({
      accessToken,
      token: accessToken,
      refreshToken,
      historyId,
      user: userData,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

// =======================
// POST /api/auth/quick-login (development bypass)
// =======================

router.post('/quick-login', async (req, res) => {
  try {
    const { email, role, name } = req.body;

    if (!email || !role || !name) {
      return res.status(400).json({ message: 'Email, role, and name are required' });
    }

    let user = null;

    // Try DB first
    try {
      user = await getOne('SELECT * FROM users WHERE email = ?', [email]);

      if (!user) {
        const hashedPassword = await bcrypt.hash('quick123', 10);
        const result = await query(
          'INSERT INTO users (name, email, password, role, email_verified, is_active) VALUES (?, ?, ?, ?, true, true)',
          [name, email, hashedPassword, role]
        );
        user = await getOne('SELECT * FROM users WHERE user_id = ?', [result.insertId]);
      }

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      const refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await query(
        'INSERT INTO user_sessions (user_id, refresh_token, device_name, browser, ip_address, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
        [user.user_id, refreshToken, 'Quick Login', 'Quick Login', req.ip || '127.0.0.1', refreshExpires]
      );

      const loginResult = await query(
        'INSERT INTO login_history (user_id, ip_address, device_name, browser) VALUES (?, ?, ?, ?)',
        [user.user_id, req.ip || '127.0.0.1', 'Quick Login', 'Quick Login']
      );

      await query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?', [user.user_id]);

      const { password: _, ...userData } = user;
      return res.json({
        accessToken,
        token: accessToken,
        refreshToken,
        historyId: loginResult.insertId,
        user: userData,
      });
    } catch (dbError) {
      // DB not available — use demo user fallback
      console.warn('Quick-login DB error, using demo fallback:', dbError.message);
      const demoUser = DEMO_USERS[email] || { user_id: 99, name, email, role, email_verified: true, is_active: true };
      const accessToken = generateAccessToken(demoUser);
      const refreshToken = generateRefreshToken(demoUser);
      const { password: _p, ...userData } = demoUser;
      return res.json({
        accessToken,
        token: accessToken,
        refreshToken,
        historyId: null,
        user: userData,
        _demo: true,
      });
    }
  } catch (error) {
    console.error('Quick login error:', error);
    res.status(500).json({ message: 'Quick login failed' });
  }
});

// =======================
// POST /api/auth/refresh
// =======================
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token is required' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    let user = null;
    try {
      user = await getOne('SELECT * FROM users WHERE user_id = ?', [decoded.userId]);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Check if session exists in user_sessions and is not expired
      const session = await getOne(
        'SELECT * FROM user_sessions WHERE user_id = ? AND refresh_token = ? AND expires_at > NOW()',
        [decoded.userId, refreshToken]
      );
      if (!session) {
        return res.status(401).json({ message: 'Session expired or invalid' });
      }
    } catch (dbError) {
      console.warn('Refresh token DB validation error, using demo fallback:', dbError.message);
      // Fallback for demo users
      user = Object.values(DEMO_USERS).find(u => u.user_id === decoded.userId);
      if (!user) {
        user = { user_id: decoded.userId, name: 'Demo User', role: 'customer', email: 'customer@example.com' };
      }
    }

    const newAccessToken = generateAccessToken(user);
    res.json({
      accessToken: newAccessToken,
      token: newAccessToken
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ message: 'Failed to refresh token' });
  }
});

// =====

module.exports = router;

