const db = require('../config/db');

const MessageModel = {
  // Fetch all messages sorted by oldest first (so stars don't jump around)
  getAllMessages: async () => {
    const query = 'SELECT * FROM messages ORDER BY created_at ASC';
    const result = await db.query(query);
    return result.rows;
  },

  // Save a new message
  createMessage: async (data) => {
    const query = `
      INSERT INTO messages (recipient, content, type, position_x, position_y, position_z)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      data.recipient,
      data.content,
      data.type,
      data.position_x,
      data.position_y,
      data.position_z
    ];
    
    const result = await db.query(query, values);
    return result.rows[0];
  }
};

module.exports = MessageModel;