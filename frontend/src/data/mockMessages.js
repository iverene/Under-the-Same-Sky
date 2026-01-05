import * as THREE from 'three';

// Exporting this helper so we can use it when adding new stars
export const getRandomPositionOnSphere = (radius) => {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos((Math.random() * 2) - 1);
  const r = radius * (0.8 + Math.random() * 0.4);
  return new THREE.Vector3().setFromSphericalCoords(r, phi, theta);
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

export const mockMessages = generateMockMessages();