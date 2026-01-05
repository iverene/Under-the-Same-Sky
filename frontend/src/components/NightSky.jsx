import React, { useState, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei'; // Removed 'Stars' import
import * as THREE from 'three';
import { mockMessages } from '../data/mockMessages';

// --- Helper: Generate a Glowing Star Texture ---
const useStarTexture = () => {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');      
    gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');   
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');   
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');       
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);
};

// --- Component: Zoom Handler ---
const CameraZoomHandler = () => {
  const { camera } = useThree();
  
  React.useEffect(() => {
    const handleWheel = (e) => {
      const zoomSpeed = 0.05;
      const newFov = Math.max(10, Math.min(90, camera.fov + e.deltaY * zoomSpeed));
      camera.fov = newFov;
      camera.updateProjectionMatrix();
    };

    const canvasElement = document.querySelector('canvas');
    if (canvasElement) {
      canvasElement.addEventListener('wheel', handleWheel, { passive: true });
    }

    return () => {
      if (canvasElement) {
        canvasElement.removeEventListener('wheel', handleWheel);
      }
    };
  }, [camera]);

  return null;
};

// --- Component: Interactive Message Star ---
const MessageStar = ({ position, message, color, baseSize, texture }) => {
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const spriteRef = useRef();

  useFrame(({ clock }) => {
    if (spriteRef.current) {
      const time = clock.getElapsedTime();
      const offset = message.id * 100; 
      const twinkle = Math.sin(time * 2 + offset) * 0.2 + 0.8; 
      
      spriteRef.current.material.opacity = hovered ? 1 : twinkle;
      
      const scale = hovered ? baseSize * 2.5 : baseSize;
      spriteRef.current.scale.set(scale, scale, 1);
    }
  });

  return (
    <group position={position}>
      <sprite 
        ref={spriteRef}
        onClick={(e) => {
          e.stopPropagation();
          setClicked(!clicked);
        }}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
          setHovered(true);
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
          setHovered(false);
        }}
      >
        <spriteMaterial 
          attach="material" 
          map={texture} 
          color={color} 
          transparent={true}
          depthWrite={false} 
          blending={THREE.AdditiveBlending} 
        />
      </sprite>

      {/* Popup UI */}
      {clicked && (
        <Html position={[0, 0, 0]} distanceFactor={15} zIndexRange={[100, 0]}>
          <div className="bg-gray-900/90 text-white p-4 rounded-lg border border-gray-500/50 w-64 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.3)] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xs font-bold text-blue-300 tracking-widest">TO: {message.recipient.toUpperCase()}</h3>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setClicked(false);
                }}
                className="text-gray-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            <p className="text-sm font-serif italic text-gray-100 leading-relaxed">"{message.content}"</p>
          </div>
        </Html>
      )}
    </group>
  );
};

// --- Main Component ---
const NightSky = () => {
  const starTexture = useStarTexture();

  return (
    // Changed background to plain black
    <div className="w-full h-screen bg-black">
      <Canvas camera={{ position: [0, 0, 0.1], fov: 75 }}>
        
        <CameraZoomHandler />
        <ambientLight intensity={0.5} />
        
        {/* REMOVED: <Stars /> component */}
        
        {/* Only Message Stars are displayed now */}
        {mockMessages.map((msg) => (
          <MessageStar 
            key={msg.id}
            position={msg.position}
            message={msg}
            baseSize={msg.size * 2} // Slight size bump
            color={msg.color}
            texture={starTexture}
          />
        ))}

        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          enableDamping={true}
          dampingFactor={0.05}
          rotateSpeed={0.4}
          reverseOrbit={true} 
        />
      </Canvas>

      <div className="absolute bottom-8 left-0 w-full text-center pointer-events-none select-none">
        <p className="text-blue-100/60 text-sm font-light tracking-widest uppercase">
          Scroll to Zoom • Drag to Explore
        </p>
      </div>
    </div>
  );
};

export default NightSky;