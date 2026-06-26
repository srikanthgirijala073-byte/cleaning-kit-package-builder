const nodemailer = require('nodemailer');
require('dotenv').config();

// ================================================
// Transporter Setup — auto-falls back to Ethereal
// ================================================
let etherealTransporter = null;

async function getTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const isConfigured = user && pass && !user.includes('your') && !pass.includes('your');

  if (isConfigured) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: { user, pass },
    });
  }

  // Fallback: Ethereal test account (emails are visible at ethereal.email)
  if (!etherealTransporter) {
    try {
      const testAccount = await nodemailer.createTestAccount();
      etherealTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      console.log(`\n📧 Ethereal Mail activated: ${testAccount.user}`);
      console.log(`   Preview emails at: https://ethereal.email/messages\n`);
    } catch (err) {
      // Last resort: console mock
      etherealTransporter = {
        sendMail: async (opts) => {
          console.log('\n========== MOCK EMAIL ==========');
          console.log(`To:      ${opts.to}`);
          console.log(`Subject: ${opts.subject}`);
          console.log('================================\n');
          return { messageId: 'mock-' + Date.now() };
        },
      };
    }
  }
  return etherealTransporter;
}

async function safeSendMail(opts) {
  try {
    const mailer = await getTransporter();
    const info = await mailer.sendMail(opts);
    const preview = nodemailer.getTestMessageUrl(info);
    if (preview) console.log(`📧 Email preview: ${preview}`);
    return info;
  } catch (err) {
    console.error(`❌ Email failed to ${opts.to}: ${err.message}`);
    return { messageId: 'failed-' + Date.now(), fallback: true };
  }
}

// ================================================
// Shared HTML wrapper
// ================================================
const FROM = () => process.env.EMAIL_FROM || `Cleaning Kit Builder <noreply@cleaningkitbuilder.com>`;
const FRONTEND = () => process.env.FRONTEND_URL || 'http://localhost:5173';

function wrap(title, body) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <style>
    body{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f1f5f9;margin:0;padding:0;}
    .container{max-width:600px;margin:30px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);}
    .header{background:linear-gradient(135deg,#1e40af,#3b82f6);padding:32px 40px;text-align:center;}
    .header h1{color:#fff;margin:0;font-size:22px;font-weight:700;}
    .header .logo{font-size:28px;margin-bottom:8px;}
    .body{padding:36px 40px;}
    .body h2{color:#1e293b;margin-top:0;font-size:20px;}
    .body p{color:#475569;line-height:1.7;font-size:15px;}
    .btn{display:inline-block;padding:14px 36px;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:#fff!important;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;margin:16px 0;}
    .info-box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin:20px 0;}
    .info-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0;font-size:14px;}
    .info-row:last-child{border-bottom:none;}
    .info-label{color:#64748b;font-weight:500;}
    .info-value{color:#1e293b;font-weight:600;}
    .warning{background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px;color:#dc2626;font-size:14px;margin:16px 0;}
    .footer{background:#f8fafc;padding:20px 40px;text-align:center;color:#94a3b8;font-size:13px;border-top:1px solid #e2e8f0;}
    .otp{font-size:44px;font-weight:800;letter-spacing:14px;color:#2563eb;text-align:center;padding:24px;background:#eff6ff;border-radius:12px;border:2px dashed #93c5fd;margin:20px 0;}
  </style></head><body>
  <div class="container">
    <div class="header"><div class="logo">🧹</div><h1>${title}</h1></div>
    <div class="body">${body}</div>
    <div class="footer">© ${new Date().getFullYear()} Cleaning Kit Package Builder · <a href="${FRONTEND()}" style="color:#3b82f6">Visit App</a></div>
  </div></body></html>`;
}

// ================================================
// Email Functions
// ================================================

const emailService = {

  // 1. Welcome Email
  async sendWelcome({ email, name, loginDate, device }) {
    return safeSendMail({
      from: FROM(),
      to: email,
      subject: '🎉 Welcome to Cleaning Kit Package Builder!',
      html: wrap('Welcome Aboard!', `
        <h2>Hello ${name}! 👋</h2>
        <p>Welcome to <strong>Cleaning Kit Package Builder</strong> — your all-in-one platform for managing cleaning products, orders, and customer kits.</p>
        <div class="info-box">
          <div class="info-row"><span class="info-label">Registered At</span><span class="info-value">${loginDate || new Date().toLocaleString()}</span></div>
          <div class="info-row"><span class="info-label">Device</span><span class="info-value">${device || 'Web Browser'}</span></div>
        </div>
        <p>You can now log in and start building your cleaning kits:</p>
        <a href="${FRONTEND()}/login" class="btn">Go to Dashboard</a>
        <p style="font-size:13px;color:#94a3b8;">If you didn't create this account, please ignore this email.</p>
      `),
    });
  },

  // 2. Email Verification
  async sendVerification({ email, name, token }) {
    const url = `${FRONTEND()}/verify-email?token=${token}`;
    return safeSendMail({
      from: FROM(),
      to: email,
      subject: '✉️ Verify Your Email — Cleaning Kit Builder',
      html: wrap('Verify Your Email', `
        <h2>Hello ${name},</h2>
        <p>Thanks for registering! Please verify your email address to activate your account. This link expires in <strong>24 hours</strong>.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${url}" class="btn">✅ Verify Email Address</a>
        </div>
        <p style="font-size:13px;color:#64748b;">Or copy this link: <code style="word-break:break-all;background:#f1f5f9;padding:4px 8px;border-radius:4px;">${url}</code></p>
        <p style="font-size:13px;color:#94a3b8;">If you didn't register, you can safely ignore this email.</p>
      `),
    });
  },

  // 3. Login Notification
  async sendLoginNotification({ email, name, loginDate, device, browser, ip, location }) {
    return safeSendMail({
      from: FROM(),
      to: email,
      subject: '🔔 New Login Detected — Cleaning Kit Builder',
      html: wrap('New Login Detected', `
        <h2>Hello ${name},</h2>
        <p>A new sign-in to your account was detected. Here are the details:</p>
        <div class="info-box">
          <div class="info-row"><span class="info-label">Date & Time</span><span class="info-value">${loginDate}</span></div>
          <div class="info-row"><span class="info-label">Browser</span><span class="info-value">${browser || 'Unknown'}</span></div>
          <div class="info-row"><span class="info-label">Device</span><span class="info-value">${device || 'Unknown'}</span></div>
          <div class="info-row"><span class="info-label">IP Address</span><span class="info-value">${ip || 'Unknown'}</span></div>
          <div class="info-row"><span class="info-label">Location</span><span class="info-value">${location || 'Unknown'}</span></div>
        </div>
        <div class="warning">⚠️ If this wasn't you, reset your password immediately!</div>
        <a href="${FRONTEND()}/forgot-password" class="btn">🔒 Secure My Account</a>
      `),
    });
  },

  // 4. Forgot Password / Reset Link
  async sendPasswordReset({ email, name, token }) {
    const url = `${FRONTEND()}/reset-password?token=${token}`;
    return safeSendMail({
      from: FROM(),
      to: email,
      subject: '🔑 Reset Your Password — Cleaning Kit Builder',
      html: wrap('Reset Your Password', `
        <h2>Hello ${name},</h2>
        <p>We received a request to reset your password. Click the button below to create a new password. This link expires in <strong>1 hour</strong>.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${url}" class="btn">🔑 Reset My Password</a>
        </div>
        <p style="font-size:13px;color:#64748b;">Or copy this link: <code style="word-break:break-all;background:#f1f5f9;padding:4px 8px;border-radius:4px;">${url}</code></p>
        <div class="warning">⚠️ If you didn't request a password reset, no action is needed. This link will expire in 1 hour.</div>
      `),
    });
  },

  // 5. Password Changed Confirmation
  async sendPasswordChanged({ email, name }) {
    return safeSendMail({
      from: FROM(),
      to: email,
      subject: '✅ Password Changed Successfully — Cleaning Kit Builder',
      html: wrap('Password Changed', `
        <h2>Hello ${name},</h2>
        <p>Your password has been changed successfully at <strong>${new Date().toLocaleString()}</strong>.</p>
        <div class="warning">⚠️ If you did NOT make this change, contact us immediately and reset your password.</div>
        <a href="${FRONTEND()}/forgot-password" class="btn">🔒 Secure My Account</a>
      `),
    });
  },

  // 6. Account Locked
  async sendAccountLocked({ email, name, lockUntil }) {
    return safeSendMail({
      from: FROM(),
      to: email,
      subject: '🔒 Account Temporarily Locked — Cleaning Kit Builder',
      html: wrap('Account Locked', `
        <h2>Hello ${name},</h2>
        <p>Your account has been <strong>temporarily locked</strong> due to 5 consecutive failed login attempts.</p>
        <div class="info-box">
          <div class="info-row"><span class="info-label">Locked At</span><span class="info-value">${new Date().toLocaleString()}</span></div>
          <div class="info-row"><span class="info-label">Unlocks At</span><span class="info-value">${lockUntil}</span></div>
        </div>
        <p>You can either wait 15 minutes or reset your password now:</p>
        <a href="${FRONTEND()}/forgot-password" class="btn">🔑 Reset Password</a>
      `),
    });
  },

  // 7. OTP / 2FA Code
  async sendOtp({ email, name, code }) {
    return safeSendMail({
      from: FROM(),
      to: email,
      subject: '🔐 Your Login OTP Code — Cleaning Kit Builder',
      html: wrap('Two-Factor Authentication', `
        <h2>Hello ${name},</h2>
        <p>Your one-time verification code is:</p>
        <div class="otp">${code}</div>
        <p style="text-align:center;color:#64748b;font-size:14px;">This code expires in <strong>10 minutes</strong>. Do not share it with anyone.</p>
        <div class="warning">⚠️ If you didn't request this code, someone may be trying to access your account.</div>
      `),
    });
  },

  // 8. Order Confirmation
  async sendOrderConfirmation({ email, name, orderId, items, totalAmount }) {
    const itemRows = (items || []).map(item => `
      <div class="info-row">
        <span class="info-label">${item.product_name} × ${item.quantity}</span>
        <span class="info-value">₹${parseFloat(item.total_price || 0).toFixed(2)}</span>
      </div>`).join('');

    return safeSendMail({
      from: FROM(),
      to: email,
      subject: `🛒 Order Confirmed #${orderId} — Cleaning Kit Builder`,
      html: wrap('Order Confirmed!', `
        <h2>Hello ${name},</h2>
        <p>Your order has been placed successfully! Here's a summary:</p>
        <div class="info-box">
          <div class="info-row"><span class="info-label">Order ID</span><span class="info-value">#${orderId}</span></div>
          <div class="info-row"><span class="info-label">Order Date</span><span class="info-value">${new Date().toLocaleString()}</span></div>
          ${itemRows}
          <div class="info-row"><span class="info-label" style="font-weight:700;">Total</span><span class="info-value" style="color:#2563eb;font-size:16px;">₹${parseFloat(totalAmount || 0).toFixed(2)}</span></div>
        </div>
        <a href="${FRONTEND()}/orders" class="btn">📦 Track My Order</a>
      `),
    });
  },

  // 9. Order Status Update
  async sendOrderStatusUpdate({ email, name, orderId, status }) {
    const statusEmoji = {
      placed: '📋', processing: '⚙️', packed: '📦', shipped: '🚚', delivered: '✅', cancelled: '❌'
    }[status] || '📋';

    return safeSendMail({
      from: FROM(),
      to: email,
      subject: `${statusEmoji} Order #${orderId} — ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      html: wrap('Order Status Update', `
        <h2>Hello ${name},</h2>
        <p>Your order status has been updated:</p>
        <div class="info-box">
          <div class="info-row"><span class="info-label">Order ID</span><span class="info-value">#${orderId}</span></div>
          <div class="info-row"><span class="info-label">New Status</span><span class="info-value">${statusEmoji} ${status.charAt(0).toUpperCase() + status.slice(1)}</span></div>
          <div class="info-row"><span class="info-label">Updated At</span><span class="info-value">${new Date().toLocaleString()}</span></div>
        </div>
        <a href="${FRONTEND()}/orders" class="btn">📦 View My Orders</a>
      `),
    });
  },

  // 10. Low Stock Alert (Admin)
  async sendLowStockAlert({ email, productName, remainingStock, minLevel }) {
    return safeSendMail({
      from: FROM(),
      to: email,
      subject: `⚠️ Low Stock Alert: ${productName}`,
      html: wrap('Low Stock Alert', `
        <h2>⚠️ Stock Running Low</h2>
        <p>The following product has reached critically low stock levels:</p>
        <div class="info-box">
          <div class="info-row"><span class="info-label">Product</span><span class="info-value">${productName}</span></div>
          <div class="info-row"><span class="info-label">Remaining Stock</span><span class="info-value" style="color:#dc2626;">${remainingStock} Units</span></div>
          <div class="info-row"><span class="info-label">Minimum Level</span><span class="info-value">${minLevel || 5} Units</span></div>
          <div class="info-row"><span class="info-label">Alert Time</span><span class="info-value">${new Date().toLocaleString()}</span></div>
        </div>
        <a href="${FRONTEND()}/inventory" class="btn">📦 Manage Inventory</a>
      `),
    });
  },

  // 11. Payment Success
  async sendPaymentSuccess({ email, name, transactionId, amount, date }) {
    return safeSendMail({
      from: FROM(),
      to: email,
      subject: '💳 Payment Successful — Cleaning Kit Builder',
      html: wrap('Payment Successful', `
        <h2>Hello ${name},</h2>
        <p>Your payment has been processed successfully!</p>
        <div class="info-box">
          <div class="info-row"><span class="info-label">Transaction ID</span><span class="info-value">${transactionId}</span></div>
          <div class="info-row"><span class="info-label">Amount Paid</span><span class="info-value" style="color:#16a34a;">₹${parseFloat(amount || 0).toFixed(2)}</span></div>
          <div class="info-row"><span class="info-label">Date</span><span class="info-value">${date || new Date().toLocaleString()}</span></div>
        </div>
        <a href="${FRONTEND()}/orders" class="btn">📦 View My Orders</a>
      `),
    });
  },
  // B2B-1. Quotation Email (sent/accepted/rejected)
  async sendQuotationEmail({ email, customerName, quotationId, status, totalAmount, validUntil, items }) {
    const statusMap = { sent:'📧 Sent', accepted:'✅ Accepted', rejected:'❌ Rejected', draft:'📝 Draft' };
    const emoji = statusMap[status] || '📄';
    const itemRows = (items || []).map(i => `
      <div class="info-row"><span class="info-label">${i.name} × ${i.quantity}</span><span class="info-value">₹${(i.price * i.quantity).toFixed(2)}</span></div>`).join('');
    return safeSendMail({
      from: FROM(),
      to: email,
      subject: `${emoji} Quotation #${quotationId} — ${status.charAt(0).toUpperCase()+status.slice(1)}`,
      html: wrap('Quotation Update', `
        <h2>Dear ${customerName},</h2>
        <p>Your quotation status has been updated to <strong>${emoji} ${status.charAt(0).toUpperCase()+status.slice(1)}</strong>.</p>
        <div class="info-box">
          <div class="info-row"><span class="info-label">Quotation #</span><span class="info-value">#${quotationId}</span></div>
          <div class="info-row"><span class="info-label">Valid Until</span><span class="info-value">${validUntil || '—'}</span></div>
          ${itemRows}
          <div class="info-row"><span class="info-label">Total</span><span class="info-value" style="color:#2563eb;font-weight:700;">₹${parseFloat(totalAmount||0).toFixed(2)}</span></div>
        </div>
        <a href="${FRONTEND()}/b2b/quotations" class="btn">View Quotation</a>
      `),
    });
  },

  // B2B-2. Delivery Status Email
  async sendDeliveryEmail({ email, customerName, orderId, status, driver, estimatedDate, address }) {
    const statusColor = { Delivered:'#10b981', 'In Transit':'#2563eb', Packed:'#f59e0b', Failed:'#ef4444' }[status] || '#64748b';
    return safeSendMail({
      from: FROM(),
      to: email,
      subject: `🚚 Delivery Update — Order #${orderId} is ${status}`,
      html: wrap('Delivery Status Update', `
        <h2>Dear ${customerName},</h2>
        <p>Your order delivery status has been updated.</p>
        <div class="info-box">
          <div class="info-row"><span class="info-label">Order #</span><span class="info-value">#${orderId}</span></div>
          <div class="info-row"><span class="info-label">Status</span><span class="info-value" style="color:${statusColor};font-weight:700;">${status}</span></div>
          <div class="info-row"><span class="info-label">Delivery Address</span><span class="info-value">${address || '—'}</span></div>
          <div class="info-row"><span class="info-label">Driver</span><span class="info-value">${driver || 'Unassigned'}</span></div>
          <div class="info-row"><span class="info-label">Estimated Date</span><span class="info-value">${estimatedDate || '—'}</span></div>
        </div>
        <a href="${FRONTEND()}/b2b/delivery-tracker" class="btn">🚚 Track Delivery</a>
      `),
    });
  },

  // B2B-3. Contract Expiry Reminder
  async sendContractExpiryReminder({ email, customerName, contractId, daysLeft, endDate, contractType, discountPercentage }) {
    const urgencyColor = daysLeft <= 7 ? '#dc2626' : daysLeft <= 15 ? '#d97706' : '#f59e0b';
    return safeSendMail({
      from: FROM(),
      to: email,
      subject: `⚠️ Contract Expiring in ${daysLeft} Day${daysLeft !== 1 ? 's' : ''} — Action Required`,
      html: wrap('Contract Expiry Notice', `
        <h2>Dear ${customerName},</h2>
        <p>Your <strong>${contractType || 'pricing'} contract</strong> is expiring soon. Please renew to keep your discount rates.</p>
        <div class="info-box">
          <div class="info-row"><span class="info-label">Contract #</span><span class="info-value">#${contractId}</span></div>
          <div class="info-row"><span class="info-label">Current Discount</span><span class="info-value" style="color:#059669;">${discountPercentage||0}%</span></div>
          <div class="info-row"><span class="info-label">Expiry Date</span><span class="info-value" style="color:${urgencyColor};font-weight:700;">${endDate}</span></div>
          <div class="info-row"><span class="info-label">Days Remaining</span><span class="info-value" style="color:${urgencyColor};font-size:18px;font-weight:800;">${daysLeft} Days</span></div>
        </div>
        <p style="color:#dc2626;">⚠️ Without renewal, standard pricing will apply from ${endDate}.</p>
        <a href="${FRONTEND()}/b2b/contracts" class="btn">Renew Contract</a>
      `),
    });
  },

  // B2B-4. Compliance Deadline Reminder
  async sendComplianceDeadline({ email, customerName, complianceId, complianceType, severity, targetDate, daysLeft }) {
    const sevColor = { Critical:'#dc2626', High:'#d97706', Medium:'#2563eb', Low:'#10b981' }[severity] || '#64748b';
    return safeSendMail({
      from: FROM(),
      to: email,
      subject: `🛡️ Compliance Deadline in ${daysLeft} Day${daysLeft !== 1 ? 's' : ''} — ${complianceType}`,
      html: wrap('Compliance Deadline Alert', `
        <h2>Dear ${customerName},</h2>
        <p>A compliance requirement requires your immediate attention.</p>
        <div class="info-box">
          <div class="info-row"><span class="info-label">Compliance #</span><span class="info-value">#${complianceId}</span></div>
          <div class="info-row"><span class="info-label">Type</span><span class="info-value">${complianceType}</span></div>
          <div class="info-row"><span class="info-label">Severity</span><span class="info-value" style="color:${sevColor};font-weight:700;">${severity}</span></div>
          <div class="info-row"><span class="info-label">Deadline</span><span class="info-value" style="color:#dc2626;font-weight:700;">${targetDate}</span></div>
          <div class="info-row"><span class="info-label">Days Left</span><span class="info-value" style="color:#dc2626;font-size:18px;font-weight:800;">${daysLeft} Days</span></div>
        </div>
        <a href="${FRONTEND()}/b2b/compliance" class="btn">🛡️ View Compliance Portal</a>
      `),
    });
  },

  // B2B-5. Salesman Follow-up Reminder
  async sendFollowUpReminder({ email, salesmanName, customerName, visitDate, followUpDate, notes }) {
    return safeSendMail({
      from: FROM(),
      to: email,
      subject: `📞 Follow-up Reminder: ${customerName} — Today`,
      html: wrap('Sales Follow-up Reminder', `
        <h2>Hi ${salesmanName},</h2>
        <p>You have a scheduled follow-up today with <strong>${customerName}</strong>.</p>
        <div class="info-box">
          <div class="info-row"><span class="info-label">Customer</span><span class="info-value">${customerName}</span></div>
          <div class="info-row"><span class="info-label">Original Visit</span><span class="info-value">${visitDate || '—'}</span></div>
          <div class="info-row"><span class="info-label">Follow-up Date</span><span class="info-value" style="color:#2563eb;font-weight:700;">${followUpDate}</span></div>
          ${notes ? `<div class="info-row"><span class="info-label">Notes</span><span class="info-value">${notes}</span></div>` : ''}
        </div>
        <a href="${FRONTEND()}/b2b/visits" class="btn">📞 Open Sales Visits</a>
      `),
    });
  },

  // 12. Reorder Reminder (Step 4: services/reminderService.js)
  async sendReorderReminder({ email, name, daysSinceOrder, facilityType, lastOrderDate }) {
    return safeSendMail({
      from: FROM(),
      to: email,
      subject: '🧴 Running low? Time to reorder your cleaning kit',
      html: wrap('Time to Restock', `
        <h2>Hi ${name || 'there'},</h2>
        <p>It's been <strong>${daysSinceOrder} days</strong> since your last cleaning kit order — most facilities like yours reorder by now, so you may be running low.</p>
        <div class="info-box">
          <div class="info-row"><span class="info-label">Facility Type</span><span class="info-value">${facilityType || 'N/A'}</span></div>
          <div class="info-row"><span class="info-label">Last Order Date</span><span class="info-value">${lastOrderDate ? new Date(lastOrderDate).toLocaleDateString() : 'N/A'}</span></div>
        </div>
        <p>Reorder in a couple of clicks — we'll recommend the right kit for your facility automatically.</p>
        <a href="${FRONTEND()}/kit-builder" class="btn">🔄 Reorder My Kit</a>
        <p style="font-size:13px;color:#94a3b8;">Already reordered? Ignore this — it'll stop once a new order comes through.</p>
      `),
    });
  },
};

module.exports = emailService;
