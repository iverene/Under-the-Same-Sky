import * as THREE from 'three';

// Helper: True Random Spherical Distribution
// This ensures stars are scattered everywhere without forming lines or spirals.
const getRandomPositionOnSphere = (radius) => {
  // Random angle around the Y axis (0 to 360 degrees)
  const theta = Math.random() * Math.PI * 2;
  
  // Random angle up/down (acos ensures equal distribution on sphere surface)
  // varying from -1 (south pole) to 1 (north pole)
  const phi = Math.acos((Math.random() * 2) - 1);
  
  // Add variance to the distance so they aren't all on a perfect shell
  // Some slightly closer, some slightly further
  const r = radius * (0.8 + Math.random() * 0.4);
  
  return new THREE.Vector3().setFromSphericalCoords(r, phi, theta);
};

export const generateMockMessages = (count = 1000) => {
  const messages = [];
  const types = ['star', 'falling_star', 'lantern'];
  
  for (let i = 0; i < count; i++) {
    // 95% chance to be a normal star
    const type = Math.random() > 0.95 ? types[Math.floor(Math.random() * types.length)] : 'star';
    
    messages.push({
      id: i,
      recipient: `User ${i}`,
      content: `This is a scattered message #${i}.`,
      type: type,
      // Use the new random position generator
      position: getRandomPositionOnSphere(45), 
      // Vary size more for depth perception
      size: Math.random() * 0.5 + 0.1, 
      color: type === 'lantern' ? '#ffaa00' : 'white'
    });
  }
  return messages;
};

export const mockMessages = generateMockMessages();