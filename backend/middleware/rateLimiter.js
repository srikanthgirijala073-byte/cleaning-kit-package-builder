const rateLimit = require('express-rate-limit');

// =====================
// Auth Route Limiters
// =====================

// Strict: Login - 5 attempts per 15 minutes per IP+email
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
  keyGenerator: (req) => req.ip + ':' + (req.body?.email || 'unknown'),
  skip: () => process.env.NODE_ENV === 'development', // disable in dev for easy testing
});

// Strict: Register - 10 attempts per hour per IP (relaxed for dev)
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many registration attempts. Please try again in 1 hour.' },
  skip: () => process.env.NODE_ENV === 'development',
});

// Strict: Forgot Password - 5 requests per hour
const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many password reset requests. Please try again in 1 hour.' },
  skip: () => process.env.NODE_ENV === 'development',
});

// Strict: Reset Password - 5 attempts per hour
const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many password reset attempts. Please try again in 1 hour.' },
  skip: () => process.env.NODE_ENV === 'development',
});

// Strict: OTP (send + verify) - 5 attempts per 15 minutes
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many OTP requests. Please try again in 15 minutes.' },
  skip: () => process.env.NODE_ENV === 'development',
});

// Moderate: For general/non-sensitive routes
const moderateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again later.' },
});

// Loose: For authenticated routes (profile, sessions, etc.)
const authApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down.' },
});

module.exports = {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
  otpLimiter,
  moderateLimiter,
  apiLimiter,
  authApiLimiter,
};
