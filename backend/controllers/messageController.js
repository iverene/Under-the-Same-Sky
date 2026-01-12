const MessageModel = require('../models/messageModel');

// Helper: Calculate fixed position on a sphere
const calculatePosition = (radius = 45) => {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos((Math.random() * 2) - 1);
  const r = radius * (0.8 + Math.random() * 0.4);

  return {
    x: r * Math.sin(phi) * Math.sin(theta),
    y: r * Math.cos(phi),
    z: r * Math.sin(phi) * Math.cos(theta)
  };
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
        // Only attach position object if coordinates exist (stars)
        position: msg.position_x ? { 
          x: msg.position_x, 
          y: msg.position_y, 
          z: msg.position_z 
        } : null,
        // Add visual properties that don't need database storage
        size: 0.5, 
        color: msg.type === 'star' ? 'white' : '#aaddff'
      }));

      res.json(formatted);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error fetching messages' });
    }
  },

  // 2. Create Message
  createMessage: async (req, res) => {
    const { recipient, message } = req.body;

    if (!recipient || !message) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    // --- LOGIC START ---
    // Determine type based on length
    const isFalling = message.length > 100;
    const type = isFalling ? 'falling_star' : 'star';

    // Calculate position ONLY for normal stars
    let pos = { x: null, y: null, z: null };
    if (!isFalling) {
      pos = calculatePosition(45);
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