const nodemailer = require("nodemailer");
require("dotenv").config();

const createTransporter = () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
};

const sendEmail = async ({ to, subject, html }) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log("=== EMAIL (SMTP not configured - logged) ===");
    console.log("To:", to);
    console.log("Subject:", subject);
    return { success: true, logged: true };
  }
  try {
    await transporter.sendMail({
      from: `"Cleaning Kit Builder" <${process.env.EMAIL_FROM || "noreply@cleaningkitbuilder.com"}>`,
      to, subject, html,
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to send email:", error.message);
    return { success: false, error: error.message };
  }
};

function h(body) {
  return `<div style="font-family:Arial;max-width:600px;margin:0 auto;padding:30px;background:#f8fafc;border-radius:12px;">${body}</div>`;
}

const sendVerificationEmail = async (user, token) => {
  const url = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${token}`;
  return sendEmail({
    to: user.email,
    subject: "Verify Your Email - Cleaning Kit Builder",
    html: h(`<h2>Hello ${user.name},</h2><p>Verify your email:</p><a href="${url}" style="background:#2563eb;color:white;padding:14px 36px;border-radius:10px;text-decoration:none;display:inline-block;">Verify Email</a>`),
  });
};

const sendPasswordResetEmail = async (user, token) => {
  const url = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${token}`;
  return sendEmail({
    to: user.email,
    subject: "Reset Your Password - Cleaning Kit Builder",
    html: h(`<h2>Hello ${user.name},</h2><p>Reset your password:</p><a href="${url}" style="background:#2563eb;color:white;padding:14px 36px;border-radius:10px;text-decoration:none;display:inline-block;">Reset Password</a>`),
  });
};

const sendLoginNotificationEmail = async (user, loginInfo) => {
  return sendEmail({
    to: user.email,
    subject: "New Login Detected - Cleaning Kit Builder",
    html: h(`<h2>Hello ${user.name},</h2><p>New sign-in</p><table><tr><td>Time:</td><td>${loginInfo.time}</td></tr><tr><td>Device:</td><td>${loginInfo.device}</td></tr><tr><td>IP:</td><td>${loginInfo.ip}</td></tr></table><p style="color:#dc2626">If not you, change password immediately.</p>`),
  });
};

const sendOTPEmail = async (user, otpCode) => {
  return sendEmail({
    to: user.email,
    subject: "Your OTP Code - Cleaning Kit Builder",
    html: h(`<h2>Hello ${user.name},</h2><p>Your OTP:</p><div style="font-size:40px;font-weight:bold;letter-spacing:12px;color:#2563eb;text-align:center;padding:20px;">${otpCode}</div><p>Expires in 10 minutes.</p>`),
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendLoginNotificationEmail,
  sendOTPEmail,
};
