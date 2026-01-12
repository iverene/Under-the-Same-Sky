import * as THREE from 'three';

export const generateMockWishes = (count = 50) => {
  const wishes = [];
  
  for (let i = 0; i < count; i++) {
    wishes.push({
      id: `wish-${i}`,
      recipient: i % 2 === 0 ? "The Universe" : "Someone Special",
      content: `I wish for a bright future and happiness #${i}.`,
      type: 'lantern',
      color: '#ffaa00',
      // Scatter Logic:
      // X & Z: Wide spread around the viewer (-40 to 40)
      // Y: Height variance (-20 to 30) so they look like a rising stream
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 80, 
        (Math.random() * 50) - 20,  
        (Math.random() - 0.5) * 80 
      )
    });
  }
  return wishes;
};

export const mockWishes = generateMockWishes();