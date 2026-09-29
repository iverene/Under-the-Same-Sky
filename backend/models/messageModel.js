const db = require('../config/db');

const MessageModel = {
  // Fetch all messages sorted by oldest first (so stars don't jump around).
  // Capped so a large wall can't turn every page load into a full-table scan.
  getAllMessages: async () => {
    const query = 'SELECT * FROM messages ORDER BY created_at ASC LIMIT 1000';
    const result = await db.query(query);
    return result.rows;
  },

  // Save a new message (sender is optional and may be null)
  createMessage: async (data) => {
    const query = `
      INSERT INTO messages (recipient, sender, content, type, position_x, position_y, position_z)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      data.recipient,
      data.sender || null,
      data.content,
      data.type,
      data.position_x,
      data.position_y,
      data.position_z
    ];

    try {
      const result = await db.query(query, values);
      return result.rows[0];
    } catch (err) {
      // Deploy safety: if the sender column hasn't been migrated yet
      // (Postgres 42703 undefined_column), save without it rather than 500.
      // Run the migration below ASAP — this fallback only buys time.
      if (err && err.code === '42703') {
        console.error('messages.sender column missing — saving without sender. Run: ALTER TABLE messages ADD COLUMN IF NOT EXISTS sender TEXT;');
        const legacyQuery = `
          INSERT INTO messages (recipient, content, type, position_x, position_y, position_z)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;
        const legacyResult = await db.query(legacyQuery, [
          data.recipient,
          data.content,
          data.type,
          data.position_x,
          data.position_y,
          data.position_z
        ]);
        return legacyResult.rows[0];
      }
      throw err;
    }
  }
};

module.exports = MessageModel;