const db = require('../config/db');

// Wall pages, oldest first (stable order so stars never jump around).
const PAGE_DEFAULT = 200;
const PAGE_MAX = 200;
const LIST_COLUMNS = 'id, recipient, sender, content, type, position_x, position_y, position_z, created_at';

// Cursor is "created_at,id" (created_at ISO, id integer). Garbage in →
// null out (first page), so a bad poll parameter can never 500 the wall.
const parseCursor = (cursor) => {
  if (!cursor) return null;
  const s = String(cursor);
  const idx = s.lastIndexOf(',');
  if (idx < 0) return null;
  const createdAt = s.slice(0, idx);
  const id = Number(s.slice(idx + 1));
  if (!createdAt || !Number.isInteger(id)) return null;
  const t = Date.parse(createdAt);
  if (Number.isNaN(t)) return null;
  return { createdAt: new Date(t).toISOString(), id };
};

const MessageModel = {
  // One page of the wall, newest rows via cursor for cheap delta polls.
  getMessagesPage: async ({ limit, cursor, type } = {}) => {
    const lim = Math.min(Math.max(parseInt(limit, 10) || PAGE_DEFAULT, 1), PAGE_MAX);
    const cur = parseCursor(cursor);
    const values = [];
    let where = '';
    if (cur) {
      values.push(cur.createdAt, cur.id);
      where = 'WHERE (created_at > $1 OR (created_at = $1 AND id > $2))';
    }
    if (type === 'star' || type === 'lantern' || type === 'falling_star') {
      values.push(type);
      where += (where ? ' AND ' : 'WHERE ') + `type = $${values.length}`;
    }
    values.push(lim);
    const query = `SELECT ${LIST_COLUMNS} FROM messages ${where} ORDER BY created_at ASC, id ASC LIMIT $${values.length}`;
    const result = await db.query(query, values);
    return result.rows;
  },

  // Save a new message (sender is optional and may be null)
  createMessage: async (data) => {
    const query = `
      INSERT INTO messages (recipient, sender, content, type, position_x, position_y, position_z)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, recipient, sender, content, type, position_x, position_y, position_z, created_at
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
          RETURNING id, recipient, content, type, position_x, position_y, position_z, created_at
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