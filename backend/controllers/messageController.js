const MessageModel = require('../models/messageModel');

// Helper: Calculate fixed position on a sphere, kept above the hill so
// new stars stay visible and camera flights can always arrive
const calculatePosition = (radius = 45) => {
  const SKY_FLOOR = 10;
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos((Math.random() * 2) - 1);
  const r = radius * (0.8 + Math.random() * 0.4);

  const pos = {
    x: r * Math.sin(phi) * Math.sin(theta),
    y: r * Math.cos(phi),
    z: r * Math.sin(phi) * Math.cos(theta)
  };
  if (pos.y < SKY_FLOOR) pos.y = SKY_FLOOR + Math.random() * 15;
  return pos;
};

const MessageController = {
  // 1. Get Messages
  getMessages: async (req, res) => {
    try {
      const messages = await MessageModel.getAllMessages();
      
      // Format data for frontend
      const formatted = messages.map(msg => ({
        id: msg.id,
        recipient: msg.recipient,
        content: msg.content,
        type: msg.type,
        // Only attach position object if coordinates exist (stars/lanterns)
        position: (msg.position_x !== null && msg.position_x !== undefined) ? {
          x: Number(msg.position_x),
          y: Number(msg.position_y),
          z: Number(msg.position_z)
        } : null,
        // Add visual properties that don't need database storage
        size: 0.5,
        color: msg.type === 'lantern' ? '#ffaa00' : (msg.type === 'falling_star' ? '#aaddff' : 'white')
      }));

      res.json(formatted);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error fetching messages' });
    }
  },

  // 2. Create Message
  // Accepts both backend shape { recipient, message } and
  // frontend modal shapes { recipient, message, type } / { name, wish, type: 'lantern' }
  createMessage: async (req, res) => {
    const recipient = req.body.recipient || req.body.name;
    const message = req.body.message || req.body.wish || req.body.content;
    const requestedType = req.body.type;

    if (!recipient || !message) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // --- LOGIC START ---
    let type;
    let pos = { x: null, y: null, z: null };

    if (requestedType === 'lantern') {
      // Lanterns (wishes) keep their type and get a floating start position.
      // Terrain never rises above y=-5, so y=-2 starts just above the grass
      // instead of buried in the hill.
      type = 'lantern';
      pos = {
        x: (Math.random() - 0.5) * 40,
        y: -2,
        z: (Math.random() - 0.5) * 40
      };
    } else {
      // Honor the sender's explicit choice: only 'falling_star' falls —
      // long messages stay permanent stars instead of being retyped by length
      const isFalling = requestedType === 'falling_star';
      type = isFalling ? 'falling_star' : 'star';

      // Calculate fixed sphere position ONLY for normal stars
      if (!isFalling) {
        pos = calculatePosition(45);
      }
    }
    // --- LOGIC END ---

    try {
      const newMessage = await MessageModel.createMessage({
        recipient,
        content: message,
        type,
        position_x: pos.x,
        position_y: pos.y,
        position_z: pos.z
      });
      res.json(newMessage);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error saving message' });
    }
  }
};

module.exports = MessageController;