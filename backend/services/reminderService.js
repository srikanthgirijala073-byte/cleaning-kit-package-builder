/**
 * reminderService.js
 * -----------------------------------------------------------------
 * "Step 4: Reorder Reminders" — a scheduled job that nudges customers
 * to reorder their cleaning kit once enough time has passed since
 * their last order.
 *
 * Design notes:
 *   - All data access lives in models/Order.js (findCustomersDueForReminder,
 *     markReminded) so this file stays focused on *scheduling + orchestration*,
 *     matching the rest of the codebase's controller/service/model split.
 *   - Runs against the existing MySQL `orders`/`customers` tables (the
 *     real source of truth for this data — see config/db.js). Mongoose in
 *     this project is wired up exclusively for the RBAC Manager/Staff
 *     accounts (config/mongodb.js), not for orders, so there is
 *     intentionally no Mongoose model involved here.
 *   - Emails are sent via utils/emailService.js, which already falls back
 *     to an Ethereal test inbox (or a console mock) when SMTP env vars
 *     aren't configured, so this works out of the box in development.
 *   - Each customer is processed independently and a failure for one
 *     (bad email, transient SMTP error, etc.) never blocks the rest of
 *     the batch.
 */

const cron = require('node-cron');
const Order = require('../models/Order');
const emailService = require('../utils/emailService');

// -----------------------------------------------------------------
// Tunables (overridable via env vars without a code change)
// -----------------------------------------------------------------
const REORDER_THRESHOLD_DAYS = parseInt(process.env.REMINDER_REORDER_THRESHOLD_DAYS, 10) || 30;
const REMINDER_COOLDOWN_DAYS = parseInt(process.env.REMINDER_COOLDOWN_DAYS, 10) || 14;
// Default: every day at 09:00 server time.
const CRON_SCHEDULE = process.env.REMINDER_CRON_SCHEDULE || '0 9 * * *';

let scheduledTask = null;

/**
 * sendReminderFor(customerRow)
 * Sends one reminder email and stamps last_reminded_at on success.
 * Returns { order_id, email, success, error? } so the caller can report
 * a batch summary without one bad email crashing the whole job.
 */
async function sendReminderFor(row) {
  const daysSinceOrder = Math.floor(
    (Date.now() - new Date(row.last_order_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  try {
    const result = await emailService.sendReorderReminder({
      email: row.email,
      name: row.name,
      daysSinceOrder,
      facilityType: row.facility_type,
      lastOrderDate: row.last_order_at,
    });

    // emailService never throws (it swallows SMTP errors and returns a
    // `{ fallback: true }` marker instead), so check that flag explicitly
    // rather than relying on a catch block to detect a failed send.
    if (result && result.fallback) {
      return { order_id: row.order_id, email: row.email, success: false, error: 'Email send failed' };
    }

    await Order.markReminded(row.order_id);
    return { order_id: row.order_id, email: row.email, success: true };
  } catch (err) {
    return { order_id: row.order_id, email: row.email, success: false, error: err.message };
  }
}

/**
 * runReminderJob()
 * The core job: find every customer due for a reminder and email them.
 * Exported on its own (not just via the cron callback) so it can be:
 *   - triggered manually from an admin route ("Send reminders now" button)
 *   - called directly from a test, with no cron/timer involved
 */
async function runReminderJob() {
  const startedAt = new Date();
  let dueCustomers = [];

  try {
    dueCustomers = await Order.findCustomersDueForReminder({
      reorderThresholdDays: REORDER_THRESHOLD_DAYS,
      reminderCooldownDays: REMINDER_COOLDOWN_DAYS,
    });
  } catch (err) {
    console.error('[reminderService] Failed to query due customers:', err.message);
    return { total: 0, sent: 0, failed: 0, results: [], startedAt, finishedAt: new Date() };
  }

  if (dueCustomers.length === 0) {
    return { total: 0, sent: 0, failed: 0, results: [], startedAt, finishedAt: new Date() };
  }

  // Sequential, not Promise.all: keeps SMTP send rate gentle and makes
  // per-customer failures easy to attribute in logs. Volume here is
  // expected to be small (one run per day, only customers past the
  // threshold), so throughput isn't a concern.
  const results = [];
  for (const row of dueCustomers) {
    results.push(await sendReminderFor(row));
  }

  const sent = results.filter((r) => r.success).length;
  const failed = results.length - sent;

  console.log(`[reminderService] Reminder run complete: ${sent} sent, ${failed} failed, ${dueCustomers.length} due.`);

  return { total: dueCustomers.length, sent, failed, results, startedAt, finishedAt: new Date() };
}

/**
 * start()
 * Schedules runReminderJob() to fire on CRON_SCHEDULE. Idempotent — calling
 * start() twice (e.g. accidental double require in a hot-reload setup)
 * won't register a second overlapping task.
 */
function start() {
  if (scheduledTask) {
    return scheduledTask;
  }

  scheduledTask = cron.schedule(CRON_SCHEDULE, () => {
    runReminderJob().catch((err) => {
      console.error('[reminderService] Unhandled error in scheduled run:', err.message);
    });
  });

  console.log(`[reminderService] Reorder reminder cron scheduled ("${CRON_SCHEDULE}", threshold=${REORDER_THRESHOLD_DAYS}d, cooldown=${REMINDER_COOLDOWN_DAYS}d)`);
  return scheduledTask;
}

/**
 * stop()
 * Mainly useful for tests / graceful shutdown so Jest (or nodemon) doesn't
 * hang on an open cron handle.
 */
function stop() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
  }
}

module.exports = { start, stop, runReminderJob };
