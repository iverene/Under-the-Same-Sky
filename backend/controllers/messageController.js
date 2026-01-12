const MessageModel = require('../models/messageModel');

// Helper: Calculate fixed position on a sphere (For Stars)
const calculateStarPosition = (radius = 45) => {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos((Math.random() * 2) - 1);
  const r = radius * (0.8 + Math.random() * 0.4);

  return {
    x: r * Math.sin(phi) * Math.sin(theta),
    y: Math.abs(r * Math.cos(phi)) + 10, // Ensure stars are always above horizon (y > 10)
    z: r * Math.sin(phi) * Math.cos(theta)
  };
};

// Helper: Calculate position for Lanterns (Lower, floating)
const calculateLanternPosition = () => {
  return {
    x: (Math.random() - 0.5) * 60, // Wide spread
    y: -20 + (Math.random() * 10), // Start low, below the camera mostly
    z: (Math.random() - 0.5) * 60
  };
};

const MessageController = {
  // 1. Get Messages
  getMessages: async (req, res) => {
    try {
      const messages = await MessageModel.getAllMessages();
      
      const formatted = messages.map(msg => ({
        id: msg.id,
        recipient: msg.recipient,
        content: msg.content,
        type: msg.type,
        position: msg.position_x ? { 
          x: msg.position_x, 
          y: msg.position_y, 
          z: msg.position_z 
        } : null
      }));

      res.json(formatted);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error fetching messages' });
    }
  },

  // 2. Create Message
  createMessage: async (req, res) => {
    // Extract 'type' from body now (to support lanterns)
    const { recipient, message, type: reqType } = req.body;

    if (!recipient || !message) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    let type = 'star';
    let pos = { x: null, y: null, z: null };

    // --- LOGIC ---
    if (reqType === 'lantern') {
      type = 'lantern';
      pos = calculateLanternPosition();
    } else {
      // Default Star Logic
      const isFalling = message.length > 100;
      type = isFalling ? 'falling_star' : 'star';
      
      // Only generate fixed position for normal stars
      if (!isFalling) {
        pos = calculateStarPosition(50);
      }
    }

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