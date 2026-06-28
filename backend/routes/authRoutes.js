const express = require('express');
const passport = require('passport');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const { verifyRecaptcha } = require('../middleware/recaptcha');
const {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  otpLimiter,
  moderateLimiter,
  authApiLimiter
} = require('../middleware/rateLimiter');

// 1. Standard Credentials authentication
router.post('/register', registerLimiter, verifyRecaptcha, authController.register);
router.post('/login', loginLimiter, verifyRecaptcha, authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', moderateLimiter, authController.refreshToken);
router.post('/quick-login', moderateLimiter, authController.quickMockLogin);
router.post('/firebase-login', moderateLimiter, authController.firebaseLogin);

// 2. Google OAuth 2.0 routes
router.get('/google', (req, res, next) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
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

  // Store in session to remember where we came from
  if (req.session) {
    req.session.frontendUrl = frontendUrl;
    req.session.targetPath = targetPath;
  }

  if (!clientId || clientId === 'your_client_id' || clientId === 'dummy-client-id') {
    return res.redirect(`${frontendUrl}${targetPath}?chooser=true`);
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});
router.get('/google/mock-login', authController.googleOAuthMockLogin);
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login?error=google-failed', session: false }),
  authController.googleOAuthSuccess
);

// 2a. GitHub OAuth 2.0 routes
router.get('/github', (req, res, next) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const referer = req.headers.referer;
  let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
  let targetPath = '/login';
  
  if (referer) {
    try {
      const parsedUrl = new URL(referer);
      frontendUrl = parsedUrl.origin;
      targetPath = parsedUrl.pathname;
    } catch (e) {}
  }

  if (req.session) {
    req.session.frontendUrl = frontendUrl;
    req.session.targetPath = targetPath;
  }

  if (!clientId || clientId === 'dummy-github-id' || clientId === 'your_github_client_id') {
    return res.redirect(`${frontendUrl}${targetPath}?chooser=true&provider=github`);
  }
  passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
});
router.get('/github/mock-login', authController.githubOAuthMockLogin);

// 2b. Microsoft OAuth 2.0 routes
router.get('/microsoft', (req, res, next) => {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const referer = req.headers.referer;
  let frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
  let targetPath = '/login';
  
  if (referer) {
    try {
      const parsedUrl = new URL(referer);
      frontendUrl = parsedUrl.origin;
      targetPath = parsedUrl.pathname;
    } catch (e) {}
  }

  if (req.session) {
    req.session.frontendUrl = frontendUrl;
    req.session.targetPath = targetPath;
  }

  if (!clientId || clientId === 'dummy-microsoft-id' || clientId === 'your_microsoft_client_id') {
    return res.redirect(`${frontendUrl}${targetPath}?chooser=true&provider=microsoft`);
  }
  passport.authenticate('microsoft', { scope: ['user.read'] })(req, res, next);
});
router.get('/microsoft/mock-login', authController.microsoftOAuthMockLogin);


// 3. Verification & Resets
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/resend-verification', forgotPasswordLimiter, authController.resendVerification);
router.post('/forgot-password', forgotPasswordLimiter, verifyRecaptcha, authController.forgotPassword);
router.post('/reset-password', resetPasswordLimiter, authController.resetPassword);

// 4. Two-Factor Authentication (2FA) OTP
router.post('/send-otp', otpLimiter, authController.sendOtp);
router.post('/verify-otp', otpLimiter, authController.verifyOtp);

// 5. User Profiles (supported aliases) - protected + rate limited
router.get('/me', authMiddleware, authApiLimiter, authController.getMe);
router.get('/profile', authMiddleware, authApiLimiter, authController.getMe);
router.put('/profile', authMiddleware, authApiLimiter, upload.single('profile_image'), authController.updateProfile);
router.put('/change-password', authMiddleware, authApiLimiter, authController.changePassword);

// 6. Security Log history
router.get('/login-history', authMiddleware, authApiLimiter, authController.getLoginHistory);
router.get('/audit-logs', authMiddleware, authApiLimiter, authController.getAuditLogs);

// 7. Session Management & Portability
router.get('/sessions', authMiddleware, authApiLimiter, authController.getActiveSessions);
router.post('/sessions/terminate-others', authMiddleware, authApiLimiter, authController.terminateOtherSessions);
router.get('/download-data', authMiddleware, authApiLimiter, authController.downloadUserData);
router.delete('/delete-account', authMiddleware, authApiLimiter, authController.deleteAccount);


module.exports = router;
