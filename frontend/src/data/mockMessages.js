import * as THREE from 'three';

// Exporting this helper so we can use it when adding new stars.
// New stars must hang above the hill — below-horizon draws are resampled
// so flights can always arrive and arrivals stay visible.
export const getRandomPositionOnSphere = (radius) => {
  const SKY_FLOOR = 10;
  let pos = new THREE.Vector3();
  for (let i = 0; i < 12; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    const r = radius * (0.8 + Math.random() * 0.4);
    pos = new THREE.Vector3().setFromSphericalCoords(r, phi, theta);
    if (pos.y >= SKY_FLOOR) return pos;
  }
  pos.y = Math.max(pos.y, SKY_FLOOR);
  return pos;
};

export const generateMockMessages = (count = 200) => {
  const messages = [];
  const types = ['star', 'falling_star']; // Removed lantern for simplicity in this step
  
  for (let i = 0; i < count; i++) {
    // 80% chance to be a normal star
    const type = Math.random() > 0.8 ? 'falling_star' : 'star';
    
    messages.push({
      id: i,
      recipient: `User ${i}`,
      content: `This is message #${i}.`,
      type: type,
      position: type === 'star' ? getRandomPositionOnSphere(45) : null, // Falling stars don't have fixed positions
      size: Math.random() * 0.5 + 0.1,
      color: 'white'
    });
  }
  return messages;
};

export const mockMessages = generateMockMessages(280);