const db = require('../config/db');

/**
 * AuditLog model
 * -----------------------------------------------------------------
 * "Step 5: Action History" — tracks who changed a record and when.
 *
 * The base `audit_logs` table (schema.sql) only has
 * (user_id, action, details, ip_address, created_at). This model adds
 * three optional columns used by the new portal/dashboard/bundling
 * features:
 *   - actor_label : free-text identity of the actor (e.g.
 *     "manager:jane@x.com" or "super-admin"). Needed because actions
 *     can originate from the RBAC Admin/Manager/Staff system, whose
 *     user ids live in MongoDB and are NOT valid foreign keys into the
 *     MySQL `users` table that `user_id` references. Recording the
 *     actor as text avoids ever violating that foreign key.
 *   - entity_type / entity_id : which record was affected (e.g.
 *     entity_type='order', entity_id=42), so a UI can show "history for
 *     this specific order" instead of only "history for this user".
 *
 * Run `npm run setup-db` (backend/scripts/updateSchema.js) to add these
 * columns. Until that migration has run, create() automatically falls
 * back to the legacy 4-column insert so audit logging never breaks the
 * action it's attached to.
 */
const AuditLog = {
  async create({ userId = null, actorLabel = '', action, details = '', ipAddress = '', entityType = null, entityId = null }) {
    try {
      await db.execute(
        'INSERT INTO audit_logs (user_id, actor_label, action, details, ip_address, entity_type, entity_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, actorLabel, action, details, ipAddress, entityType, entityId ?? null]
      );
    } catch (error) {
      // ER_BAD_FIELD_ERROR (1054) means the extended columns don't exist
      // yet because `npm run setup-db` hasn't been re-run. Fall back to
      // the original 4-column insert so the calling action (e.g. an
      // order update) is never blocked by audit logging.
      if (error && (error.code === 'ER_BAD_FIELD_ERROR' || error.errno === 1054)) {
        console.warn('[AuditLog] entity_type/entity_id/actor_label columns missing — run `npm run setup-db` to enable full audit tracking. Falling back to legacy insert.');
        await db.execute(
          'INSERT INTO audit_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)',
          [userId, action, `${actorLabel ? `[${actorLabel}] ` : ''}${details}`, ipAddress]
        );
        return;
      }
      throw error;
    }
  },

  async findByUserId(userId) {
    const [rows] = await db.execute(
      'SELECT id, user_id, action, details, ip_address, created_at FROM audit_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [userId]
    );
    return rows;
  },

  /**
   * findByEntity('order', 42) -> full action history for order #42,
   * regardless of which user/role made each change. Falls back to an
   * empty array (instead of throwing) if the migration hasn't added
   * entity_type/entity_id yet, so callers can render "no history yet"
   * rather than crashing.
   */
  async findByEntity(entityType, entityId) {
    try {
      const [rows] = await db.execute(
        'SELECT id, user_id, actor_label, action, details, ip_address, created_at FROM audit_logs WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC LIMIT 100',
        [entityType, entityId]
      );
      return rows;
    } catch (error) {
      if (error && (error.code === 'ER_BAD_FIELD_ERROR' || error.errno === 1054)) {
        console.warn('[AuditLog] entity_type/entity_id columns missing — run `npm run setup-db` to enable per-record history.');
        return [];
      }
      throw error;
    }
  }
};

module.exports = AuditLog;
