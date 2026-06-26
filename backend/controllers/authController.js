const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const VerificationToken = require('../models/VerificationToken');
const ResetToken = require('../models/ResetToken');
const LoginHistory = require('../models/LoginHistory');
const Session = require('../models/Session');
const OtpCode = require('../models/OtpCode');
const AuditLog = require('../models/AuditLog');
const emailService = require('../utils/emailService');
const { secret } = require('../config/jwt');
const { parseUserAgent, getLocationFromIp } = require('../utils/helpers');

// Helper to generate access and refresh tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, secret, { expiresIn: '15m' });
  const refreshToken = crypto.randomBytes(40).toString('hex');
  return { accessToken, refreshToken };
};

const authController = {
  // POST /api/auth/register
  async register(req, res, next) {
    try {
      const { name, email, password, role, phone, address } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required.' });
      }

      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email address.' });
      }

      // Create user
      const userId = await User.create({
        name,
        email,
        password,
        role: role || 'customer',
        phone: phone || '',
        address: address || '',
        email_verified: false // User must verify email before accessing all features
      });

      const user = await User.findById(userId);

      // Generate verification token (expires in 24 hours)
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await VerificationToken.create(userId, token, expiresAt);

      // Send Verification Email
      await emailService.sendVerification({
        email: user.email,
        name: user.name,
        token
      });

      // Parse user-agent & IP for logging
      const { browser, device } = parseUserAgent(req.headers['user-agent']);
      const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
      
      // Log audit trail
      await AuditLog.create({
        userId,
        action: 'REGISTER',
        details: `Created account with email ${email}. Verification token dispatched.`,
        ipAddress: ip
      });

      // Send Welcome Email (stateless signup welcome)
      const formattedDate = new Date().toLocaleString();
      await emailService.sendWelcome({
        email: user.email,
        name: user.name,
        loginDate: formattedDate,
        device: `${device} / ${browser}`
      });

      res.status(201).json({
        message: 'Registration successful! You can now log in immediately.'
      });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/auth/login
  async login(req, res, next) {
    try {
      const { email, password, rememberMe } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Please provide email and password.' });
      }

      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      // Check if account is locked
      if (user.account_locked) {
        const now = new Date();
        const lockTime = new Date(user.lock_until);
        if (now < lockTime) {
          const minutesLeft = Math.ceil((lockTime - now) / 60000);
          return res.status(403).json({
            message: `This account is temporarily locked due to multiple failed login attempts. Please try again in ${minutesLeft} minutes, or reset your password.`
          });
        } else {
          // Unlock if lock time passed
          await User.resetFailedAttempts(user.user_id);
          user.account_locked = 0;
          user.failed_login_attempts = 0;
        }
      }

      // If user logs in via Google only, they don't have a password
      if (!user.password && user.google_id) {
        return res.status(400).json({ message: 'This account is registered via Google Sign-In. Please click "Continue with Google".' });
      }

      // Validate password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        const lockInfo = await User.incrementFailedAttempts(user.user_id);
        
        // Audit log
        const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
        await AuditLog.create({
          userId: user.user_id,
          action: 'LOGIN_FAILED',
          details: `Failed attempt #${lockInfo.failed_login_attempts}`,
          ipAddress: ip
        });

        if (lockInfo.account_locked) {
          // Send Account Locked Email
          await emailService.sendAccountLocked({
            email: user.email,
            name: user.name,
            lockUntil: new Date(lockInfo.lock_until).toLocaleString()
          });

          return res.status(403).json({
            message: 'This account has been locked for 15 minutes due to 5 consecutive failed login attempts. A notification email has been dispatched.'
          });
        }

        return res.status(401).json({ message: 'Invalid email or password.' });
      }

      // Check email verification status
      if (!user.email_verified) {
        return res.status(403).json({
          message: 'Your email address is not verified yet. Please check your inbox for the verification link.',
          emailNotVerified: true,
          email: user.email
        });
      }

      // Successful credentials verification - Reset failed attempts
      await User.resetFailedAttempts(user.user_id);

      // Handle Two-Factor Authentication (2FA)
      if (user.two_factor_enabled) {
        // Generate 6-digit OTP code (numbers only)
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await OtpCode.create(user.user_id, otpCode, expiresAt);

        // Send OTP email
        await emailService.sendOtp({
          email: user.email,
          name: user.name,
          otpCode
        });

        // Generate temporary login JWT
        const tempToken = jwt.sign({ tempId: user.user_id }, secret, { expiresIn: '10m' });

        return res.json({
          twoFactorRequired: true,
          tempToken,
          message: 'Two-factor OTP has been dispatched to your email address.'
        });
      }

      // Complete login directly if 2FA is not enabled
      return await authController.finalizeLogin(user, rememberMe, req, res);

    } catch (error) {
      next(error);
    }
  },

  // Finalize login helper (generates tokens, logs history, sets cookies, sends email alerts)
  async finalizeLogin(user, rememberMe, req, res) {
    const { accessToken, refreshToken } = generateTokens(user.user_id);

    // Refresh token expiry (30 days for Remember Me, else 7 days)
    const days = rememberMe ? 30 : 7;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    // Parse request headers for logs
    const { browser, device } = parseUserAgent(req.headers['user-agent']);
    const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const location = await getLocationFromIp(ip);

    // Save refresh token session in database
    await Session.create({
      userId: user.user_id,
      refreshToken,
      deviceName: device,
      browser,
      ipAddress: ip,
      expiresAt
    });

    // Save in Login History
    const historyId = await LoginHistory.create({
      userId: user.user_id,
      deviceName: device,
      browser,
      ipAddress: ip,
      location
    });

    // Update last login field on user record
    await User.updateLastLogin(user.user_id);

    // Write audit trail
    await AuditLog.create({
      userId: user.user_id,
      action: 'LOGIN_SUCCESS',
      details: `Logged in using password. Browser: ${browser}. IP: ${ip}.`,
      ipAddress: ip
    });

    // Send Login alert email
    const formattedDate = new Date().toLocaleString();
    await emailService.sendLoginNotification({
      email: user.email,
      name: user.name,
      loginDate: formattedDate,
      device,
      browser,
      ip,
      location
    });

    // Set HTTP-Only Cookie for Refresh Token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: days * 24 * 60 * 60 * 1000
    });

    const { password: _, ...userWithoutPassword } = user;

    return res.json({
      message: 'Login successful!',
      accessToken,
      refreshToken, // Send in body as well for clients that don't support cookies
      historyId,
      user: userWithoutPassword
    });
  },

  // POST /api/auth/verify-otp
  async verifyOtp(req, res, next) {
    try {
      const { code, tempToken, rememberMe } = req.body;

      if (!code || !tempToken) {
        return res.status(400).json({ message: 'Code and tempToken are required.' });
      }

      let decoded;
      try {
        decoded = jwt.verify(tempToken, secret);
      } catch (err) {
        return res.status(401).json({ message: 'OTP request expired or invalid. Please sign in again.' });
      }

      const userId = decoded.tempId;
      const validOtp = await OtpCode.findValidOtp(userId, code);
      
      if (!validOtp) {
        return res.status(400).json({ message: 'The entered OTP code is invalid or has expired.' });
      }

      // Delete the OTP code
      await OtpCode.deleteByUserId(userId);

      const user = await User.findById(userId);

      // Finalize and return active session tokens
      return await authController.finalizeLogin(user, rememberMe, req, res);

    } catch (error) {
      next(error);
    }
  },

  // POST /api/auth/send-otp
  async sendOtp(req, res, next) {
    try {
      const { tempToken } = req.body;
      if (!tempToken) return res.status(400).json({ message: 'tempToken is required.' });

      let decoded;
      try {
        decoded = jwt.verify(tempToken, secret);
      } catch (err) {
        return res.status(401).json({ message: 'Session expired. Please log in again.' });
      }

      const userId = decoded.tempId;
      const user = await User.findById(userId);

      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      await OtpCode.create(userId, otpCode, expiresAt);

      await emailService.sendOtp({
        email: user.email,
        name: user.name,
        otpCode
      });

      res.json({ message: 'A new 2FA verification OTP has been emailed.' });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/auth/verify-email/:token
  async verifyEmail(req, res, next) {
    try {
      const { token } = req.params;
      const validToken = await VerificationToken.findByToken(token);
      const wantsJson = req.xhr || (req.headers.accept && req.headers.accept.includes('json'));

      if (!validToken) {
        if (wantsJson) {
          return res.status(400).json({ message: 'Invalid or expired verification link.' });
        }
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?verified=failed`);
      }

      const now = new Date();
      const expiresAt = new Date(validToken.expires_at);

      if (now > expiresAt) {
        await VerificationToken.deleteByToken(token);
        if (wantsJson) {
          return res.status(400).json({ message: 'Verification link has expired. Please register again.' });
        }
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?verified=expired`);
      }

      // Mark user as verified
      await User.update(validToken.user_id, { email_verified: 1 });
      
      // Log event
      const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
      await AuditLog.create({
        userId: validToken.user_id,
        action: 'EMAIL_VERIFIED',
        details: 'Email address verified successfully.',
        ipAddress: ip
      });

      // Cleanup token
      await VerificationToken.deleteByToken(token);

      if (wantsJson) {
        return res.status(200).json({ message: 'Email address verified successfully! You can now log in.' });
      }
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?verified=success`);
    } catch (error) {
      next(error);
    }
  },

  // POST /api/auth/forgot-password
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: 'Email address is required.' });

      const user = await User.findByEmail(email);
      if (!user) {
        // Return 200 for security to prevent email enumeration
        return res.json({ message: 'If the email is registered, a password reset link has been dispatched.' });
      }

      // Generate password reset token (expires in 15 minutes)
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      await ResetToken.create(user.user_id, token, expiresAt);

      // Send Reset Email
      await emailService.sendPasswordReset({
        email: user.email,
        name: user.name,
        token
      });

      // Audit logs
      const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
      await AuditLog.create({
        userId: user.user_id,
        action: 'PASSWORD_RESET_REQUESTED',
        details: 'Dispatched password reset token.',
        ipAddress: ip
      });

      res.json({ message: 'If the email is registered, a password reset link has been dispatched.' });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/auth/reset-password
  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: 'Token and newPassword are required.' });
      }

      const validToken = await ResetToken.findByToken(token);
      if (!validToken) {
        return res.status(400).json({ message: 'Invalid or expired password reset link.' });
      }

      const now = new Date();
      const expiresAt = new Date(validToken.expires_at);

      if (now > expiresAt) {
        await ResetToken.deleteByToken(token);
        return res.status(400).json({ message: 'Password reset link has expired (15-minute limit).' });
      }

      // Hash and update password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await User.update(validToken.user_id, {
        password: hashedPassword,
        failed_login_attempts: 0,
        account_locked: 0,
        lock_until: null
      });

      const user = await User.findById(validToken.user_id);

      // Audit log
      const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
      await AuditLog.create({
        userId: user.user_id,
        action: 'PASSWORD_RESET_COMPLETED',
        details: 'User password reset completed successfully.',
        ipAddress: ip
      });

      // Send Password Changed Warning Email
      const formattedDate = new Date().toLocaleString();
      const { browser, device } = parseUserAgent(req.headers['user-agent']);
      await emailService.sendPasswordChanged({
        email: user.email,
        name: user.name,
        date: formattedDate,
        device: `${device} / ${browser}`
      });

      // Delete token
      await ResetToken.deleteByToken(token);

      res.json({ message: 'Password reset successfully! You can now log in.' });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/auth/refresh (Access Token Rotation)
  async refreshToken(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({ message: 'No refresh token provided.' });
      }

      const session = await Session.findByToken(refreshToken);
      if (!session) {
        return res.status(401).json({ message: 'Invalid or revoked session.' });
      }

      const now = new Date();
      const expiresAt = new Date(session.expires_at);

      if (now > expiresAt) {
        await Session.deleteByToken(refreshToken);
        res.clearCookie('refreshToken');
        return res.status(401).json({ message: 'Session has expired. Please log in again.' });
      }

      // Generate fresh access token
      const accessToken = jwt.sign({ id: session.user_id }, secret, { expiresIn: '15m' });

      res.json({ accessToken });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/auth/profile
  async getMe(req, res, next) {
    try {
      const user = await User.findById(req.user.user_id);
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/auth/profile
  async updateProfile(req, res, next) {
    try {
      const { name, phone, address, twoFactorEnabled } = req.body;
      const fields = {};
      
      if (name) fields.name = name;
      if (phone !== undefined) fields.phone = phone;
      if (address !== undefined) fields.address = address;
      
      if (twoFactorEnabled !== undefined) {
        fields.two_factor_enabled = twoFactorEnabled ? 1 : 0;
      }

      if (req.file) {
        fields.profile_image = `/uploads/${req.file.filename}`;
      }

      await User.update(req.user.user_id, fields);

      // Log audit
      const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
      await AuditLog.create({
        userId: req.user.user_id,
        action: 'UPDATE_PROFILE',
        details: `Updated fields: ${Object.keys(fields).join(', ')}`,
        ipAddress: ip
      });

      const updated = await User.findById(req.user.user_id);
      const { password: _, ...userWithoutPassword } = updated;

      res.json({ message: 'Profile updated successfully!', user: userWithoutPassword });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/auth/change-password
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.user_id;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required.' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      if (user.password) {
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
          return res.status(400).json({ message: 'Incorrect current password.' });
        }
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await User.update(userId, { password: hashedPassword });

      // Log audit
      const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
      await AuditLog.create({
        userId,
        action: 'PASSWORD_CHANGED',
        details: 'User successfully updated account password via settings.',
        ipAddress: ip
      });

      // Send confirmation email
      const formattedDate = new Date().toLocaleString();
      const { browser, device } = parseUserAgent(req.headers['user-agent']);
      await emailService.sendPasswordChanged({
        email: user.email,
        name: user.name,
        date: formattedDate,
        device: `${device} / ${browser}`
      });

      res.json({ message: 'Password updated successfully!' });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/auth/login-history
  async getLoginHistory(req, res, next) {
    try {
      const history = await LoginHistory.findByUserId(req.user.user_id);
      res.json(history);
    } catch (error) {
      next(error);
    }
  },

  // POST /api/auth/resend-verification
  async resendVerification(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'Email address is required.' });
      }

      const user = await User.findByEmail(email);
      if (!user) {
        // Don't reveal whether the email exists
        return res.json({ message: 'If the account exists, a verification email has been sent.' });
      }

      // Check if already verified
      if (user.email_verified) {
        return res.json({ message: 'This email address is already verified. You can log in.' });
      }

      // Delete any existing verification tokens for this user
      await VerificationToken.deleteByUserId(user.user_id);

      // Generate new verification token (expires in 24 hours)
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await VerificationToken.create(user.user_id, token, expiresAt);

      // Send Verification Email
      await emailService.sendVerification({
        email: user.email,
        name: user.name,
        token
      });

      // Log audit trail
      const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
      await AuditLog.create({
        userId: user.user_id,
        action: 'VERIFICATION_RESENT',
        details: `Resent verification email to ${email}.`,
        ipAddress: ip
      });

      res.json({ message: 'A new verification link has been sent to your email.' });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/auth/logout
  async logout(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      
      if (refreshToken) {
        await Session.deleteByToken(refreshToken);
      }

      // Try recording logout time in history
      const { historyId } = req.body;
      if (historyId) {
        await LoginHistory.recordLogout(historyId);
      }

      // Log audit
      const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
      await AuditLog.create({
        userId: req.user ? req.user.user_id : null,
        action: 'LOGOUT',
        details: 'User logged out and session cleared.',
        ipAddress: ip
      });

      res.clearCookie('refreshToken');
      res.json({ message: 'Logged out successfully!' });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/auth/google/success (Google OAuth redirection callback handler)
  async googleOAuthSuccess(req, res) {
    try {
      let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      let targetPath = '/login';
      if (req.session && req.session.frontendUrl) {
        frontendUrl = req.session.frontendUrl;
        targetPath = req.session.targetPath || '/login';
      }

      if (!req.user) {
        return res.redirect(`${frontendUrl}${targetPath}?error=google-failed`);
      }

      // Finalize login (generate token, log details) and return redirect with query token parameters
      const { accessToken, refreshToken } = generateTokens(req.user.user_id);

      const days = 30; // Google log in sessions last 30 days
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      const { browser, device } = parseUserAgent(req.headers['user-agent']);
      const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
      const location = await getLocationFromIp(ip);

      await Session.create({
        userId: req.user.user_id,
        refreshToken,
        deviceName: device,
        browser,
        ipAddress: ip,
        expiresAt
      });

      const historyId = await LoginHistory.create({
        userId: req.user.user_id,
        deviceName: device,
        browser,
        ipAddress: ip,
        location
      });

      await User.updateLastLogin(req.user.user_id);

      await AuditLog.create({
        userId: req.user.user_id,
        action: 'LOGIN_GOOGLE',
        details: `Logged in using Google OAuth. Browser: ${browser}. IP: ${ip}.`,
        ipAddress: ip
      });

      const formattedDate = new Date().toLocaleString();
      await emailService.sendLoginNotification({
        email: req.user.email,
        name: req.user.name,
        loginDate: formattedDate,
        device,
        browser,
        ip,
        location
      });

      // Send tokens to client as hash or query parameters (redirect safe)
      return res.redirect(`${frontendUrl}${targetPath}?token=${accessToken}&refreshToken=${refreshToken}&historyId=${historyId}`);
    } catch (err) {
      console.error('Google OAuth Finalize Error:', err);
      let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      let targetPath = '/login';
      if (req.session && req.session.frontendUrl) {
        frontendUrl = req.session.frontendUrl;
        targetPath = req.session.targetPath || '/login';
      }
      return res.redirect(`${frontendUrl}${targetPath}?error=google-error`);
    }
  },

  async getAuditLogs(req, res, next) {
    try {
      const logs = await AuditLog.findByUserId(req.user.user_id);
      res.json(logs);
    } catch (error) {
      next(error);
    }
  },

  async googleOAuthMockLogin(req, res, next) {
    try {
      const { email, name, profileImage, googleId } = req.query;

      const referer = req.headers.referer;
      let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      let targetPath = '/login';
      
      if (referer) {
        try {
          const parsedUrl = new URL(referer);
          frontendUrl = parsedUrl.origin;
          targetPath = parsedUrl.pathname;
        } catch (e) {
          // Fallback
        }
      }

      if (!email || !googleId) {
        return res.redirect(`${frontendUrl}${targetPath}?error=google-failed`);
      }

      // Check if user exists by Google ID
      let user = await User.findByGoogleId(googleId);
      
      if (!user) {
        // Check by email
        user = await User.findByEmail(email);
        
        if (user) {
          // Link Google ID
          await User.update(user.user_id, { google_id: googleId, email_verified: 1 });
          user = await User.findById(user.user_id);
        } else {
          // Create new user
          const newUserId = await User.create({
            name: name || 'Google User',
            email,
            google_id: googleId,
            profile_image: profileImage || '',
            email_verified: true,
            role: 'customer'
          });
          user = await User.findById(newUserId);
        }
      }

      // Finalize login (generate token, log details)
      const { accessToken, refreshToken } = generateTokens(user.user_id);
      const days = 30;
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      const { browser, device } = parseUserAgent(req.headers['user-agent']);
      const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
      const location = await getLocationFromIp(ip);

      await Session.create({
        userId: user.user_id,
        refreshToken,
        deviceName: device,
        browser,
        ipAddress: ip,
        expiresAt
      });

      const historyId = await LoginHistory.create({
        userId: user.user_id,
        deviceName: device,
        browser,
        ipAddress: ip,
        location
      });

      await User.updateLastLogin(user.user_id);

      await AuditLog.create({
        userId: user.user_id,
        action: 'LOGIN_GOOGLE_SIMULATED',
        details: `Logged in using Google Sign-In Simulation. Browser: ${browser}. IP: ${ip}.`,
        ipAddress: ip
      });

      const formattedDate = new Date().toLocaleString();
      await emailService.sendLoginNotification({
        email: user.email,
        name: user.name,
        loginDate: formattedDate,
        device,
        browser,
        ip,
        location
      });

      return res.redirect(`${frontendUrl}${targetPath}?token=${accessToken}&refreshToken=${refreshToken}&historyId=${historyId}`);
    } catch (err) {
      console.error('Google OAuth Mock Login Error:', err);
      const referer = req.headers.referer;
      let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      let targetPath = '/login';
      if (referer) {
        try {
          const parsedUrl = new URL(referer);
          frontendUrl = parsedUrl.origin;
          targetPath = parsedUrl.pathname;
        } catch (e) {}
      }
      return res.redirect(`${frontendUrl}${targetPath}?error=google-error`);
    }
  },

  async githubOAuthMockLogin(req, res, next) {
    const referer = req.headers.referer;
    let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    let targetPath = '/login';
    if (referer) {
      try {
        const parsedUrl = new URL(referer);
        frontendUrl = parsedUrl.origin;
        targetPath = parsedUrl.pathname;
      } catch (e) {}
    }

    try {
      const { email, name, profileImage, googleId } = req.query;
      const githubId = googleId || req.query.githubId;

      if (!email || !githubId) {
        return res.redirect(`${frontendUrl}${targetPath}?error=github-failed`);
      }

      let user = await User.findByGithubId(githubId);
      if (!user) {
        user = await User.findByEmail(email);
        if (user) {
          await User.update(user.user_id, { github_id: githubId, email_verified: 1 });
          user = await User.findById(user.user_id);
        } else {
          const newUserId = await User.create({
            name: name || 'GitHub User',
            email,
            github_id: githubId,
            profile_image: profileImage || '',
            email_verified: true,
            role: 'customer'
          });
          user = await User.findById(newUserId);
        }
      }

      const { accessToken, refreshToken } = generateTokens(user.user_id);
      const days = 30;
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      const { browser, device } = parseUserAgent(req.headers['user-agent']);
      const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
      const location = await getLocationFromIp(ip);

      await Session.create({
        userId: user.user_id,
        refreshToken,
        deviceName: device,
        browser,
        ipAddress: ip,
        expiresAt
      });

      const historyId = await LoginHistory.create({
        userId: user.user_id,
        deviceName: device,
        browser,
        ipAddress: ip,
        location
      });

      await User.updateLastLogin(user.user_id);
      await AuditLog.create({
        userId: user.user_id,
        action: 'LOGIN_GITHUB_SIMULATED',
        details: `Logged in using GitHub Sign-In Simulation. Browser: ${browser}. IP: ${ip}.`,
        ipAddress: ip
      });

      const formattedDate = new Date().toLocaleString();
      await emailService.sendLoginNotification({
        email: user.email,
        name: user.name,
        loginDate: formattedDate,
        device,
        browser,
        ip,
        location
      });

      return res.redirect(`${frontendUrl}${targetPath}?token=${accessToken}&refreshToken=${refreshToken}&historyId=${historyId}`);
    } catch (err) {
      console.error('GitHub OAuth Mock Login Error:', err);
      return res.redirect(`${frontendUrl}${targetPath}?error=github-error`);
    }
  },

  async microsoftOAuthMockLogin(req, res, next) {
    const referer = req.headers.referer;
    let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    let targetPath = '/login';
    if (referer) {
      try {
        const parsedUrl = new URL(referer);
        frontendUrl = parsedUrl.origin;
        targetPath = parsedUrl.pathname;
      } catch (e) {}
    }

    try {
      const { email, name, profileImage, googleId } = req.query;
      const microsoftId = googleId || req.query.microsoftId;

      if (!email || !microsoftId) {
        return res.redirect(`${frontendUrl}${targetPath}?error=microsoft-failed`);
      }

      let user = await User.findByMicrosoftId(microsoftId);
      if (!user) {
        user = await User.findByEmail(email);
        if (user) {
          await User.update(user.user_id, { microsoft_id: microsoftId, email_verified: 1 });
          user = await User.findById(user.user_id);
        } else {
          const newUserId = await User.create({
            name: name || 'Microsoft User',
            email,
            microsoft_id: microsoftId,
            profile_image: profileImage || '',
            email_verified: true,
            role: 'customer'
          });
          user = await User.findById(newUserId);
        }
      }

      const { accessToken, refreshToken } = generateTokens(user.user_id);
      const days = 30;
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      const { browser, device } = parseUserAgent(req.headers['user-agent']);
      const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
      const location = await getLocationFromIp(ip);

      await Session.create({
        userId: user.user_id,
        refreshToken,
        deviceName: device,
        browser,
        ipAddress: ip,
        expiresAt
      });

      const historyId = await LoginHistory.create({
        userId: user.user_id,
        deviceName: device,
        browser,
        ipAddress: ip,
        location
      });

      await User.updateLastLogin(user.user_id);
      await AuditLog.create({
        userId: user.user_id,
        action: 'LOGIN_MICROSOFT_SIMULATED',
        details: `Logged in using Microsoft Sign-In Simulation. Browser: ${browser}. IP: ${ip}.`,
        ipAddress: ip
      });

      const formattedDate = new Date().toLocaleString();
      await emailService.sendLoginNotification({
        email: user.email,
        name: user.name,
        loginDate: formattedDate,
        device,
        browser,
        ip,
        location
      });

      return res.redirect(`${frontendUrl}${targetPath}?token=${accessToken}&refreshToken=${refreshToken}&historyId=${historyId}`);
    } catch (err) {
      console.error('Microsoft OAuth Mock Login Error:', err);
      return res.redirect(`${frontendUrl}${targetPath}?error=microsoft-error`);
    }
  },

  async getActiveSessions(req, res, next) {
    try {
      const sessions = await Session.findByUserId(req.user.user_id);
      const currentToken = req.cookies.refreshToken || req.headers['x-refresh-token'];
      const currentSessionToken = currentToken ? await Session.findByToken(currentToken) : null;
      const currentSessionId = currentSessionToken ? currentSessionToken.id : null;
      
      const mappedSessions = sessions.map(session => ({
        ...session,
        isCurrent: session.id === currentSessionId
      }));

      res.json(mappedSessions);
    } catch (error) {
      next(error);
    }
  },

  async terminateOtherSessions(req, res, next) {
    try {
      const currentToken = req.cookies.refreshToken || req.body.refreshToken || req.headers['x-refresh-token'];
      if (!currentToken) {
        return res.status(400).json({ message: 'Active session refresh token is required.' });
      }

      await Session.deleteOtherSessions(req.user.user_id, currentToken);
      
      const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
      await AuditLog.create({
        userId: req.user.user_id,
        action: 'TERMINATE_OTHER_SESSIONS',
        details: 'Terminated all other active sessions for user.',
        ipAddress: ip
      });

      res.json({ message: 'All other active sessions have been successfully terminated.' });
    } catch (error) {
      next(error);
    }
  },

  async downloadUserData(req, res, next) {
    try {
      const user = await User.findById(req.user.user_id);
      const loginHistory = await LoginHistory.findByUserId(req.user.user_id);
      const auditLogs = await AuditLog.findByUserId(req.user.user_id);

      const { password: _, ...cleanUser } = user;

      const userDataExport = {
        profile: cleanUser,
        loginHistory,
        auditLogs,
        downloadedAt: new Date().toISOString(),
        appName: 'Cleaning Kit Package Builder'
      };

      res.setHeader('Content-disposition', 'attachment; filename=personal_data.json');
      res.setHeader('Content-type', 'application/json');
      res.write(JSON.stringify(userDataExport, null, 2));
      res.end();
    } catch (error) {
      next(error);
    }
  },

  async deleteAccount(req, res, next) {
    try {
      const userId = req.user.user_id;

      await User.delete(userId);

      const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
      await AuditLog.create({
        userId: null,
        action: 'DELETE_ACCOUNT',
        details: `Deleted user ID: ${userId}`,
        ipAddress: ip
      });

      res.clearCookie('refreshToken');
      res.json({ message: 'Your account and all personal data have been permanently deleted.' });
    } catch (error) {
      next(error);
    }
  },

  async quickMockLogin(req, res, next) {
    try {
      const { email, role, name } = req.body;
      if (!email) {
        return res.status(400).json({ message: 'Email address is required.' });
      }

      let user = await User.findByEmail(email);
      if (!user) {
        // Create user
        const newUserId = await User.create({
          name: name || `${role.charAt(0).toUpperCase() + role.slice(1)} User`,
          email,
          email_verified: true,
          role: role || 'customer'
        });
        user = await User.findById(newUserId);
      } else if (role && user.role !== role) {
        // Update role if switching roles for demonstration
        await User.update(user.user_id, { role });
        user.role = role;
      }

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.user_id);
      const days = 30;
      const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

      const { browser, device } = parseUserAgent(req.headers['user-agent']);
      const ip = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
      const location = await getLocationFromIp(ip);

      await Session.create({
        userId: user.user_id,
        refreshToken,
        deviceName: device,
        browser,
        ipAddress: ip,
        expiresAt
      });

      const historyId = await LoginHistory.create({
        userId: user.user_id,
        deviceName: device,
        browser,
        ipAddress: ip,
        location
      });

      await User.updateLastLogin(user.user_id);

      await AuditLog.create({
        userId: user.user_id,
        action: 'QUICK_LOGIN_BYPASS',
        details: `One-click bypass login as ${user.role}. Browser: ${browser}. IP: ${ip}.`,
        ipAddress: ip
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: days * 24 * 60 * 60 * 1000
      });

      const { password: _, ...userWithoutPassword } = user;

      return res.json({
        message: 'Login successful!',
        accessToken,
        refreshToken,
        historyId,
        user: userWithoutPassword
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;
