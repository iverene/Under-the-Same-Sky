import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { mockMessages, getRandomPositionOnSphere } from '../data/mockMessages';
import ComposeModal from './ComposeModal';
import HUD from './HUD'; // Import the new component

// --- Assets ---
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
    return new THREE.CanvasTexture(canvas);
  }, []);
};

// --- Component: Zoom Handler ---
const CameraZoomHandler = () => {
  const { camera } = useThree();
  
  useEffect(() => {
    const handleWheel = (e) => {
      e.preventDefault(); // Stop page scrolling
      const zoomSpeed = 0.05;
      const newFov = Math.max(10, Math.min(90, camera.fov + e.deltaY * zoomSpeed));
      camera.fov = newFov;
      camera.updateProjectionMatrix();
    };

    const canvasElement = document.querySelector('canvas');
    if (canvasElement) {
      canvasElement.addEventListener('wheel', handleWheel, { passive: false });
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
        onClick={(e) => { e.stopPropagation(); setClicked(!clicked); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; setHovered(true); }}
        onPointerOut={() => { document.body.style.cursor = 'default'; setHovered(false); }}
      >
        <spriteMaterial attach="material" map={texture} color={color} transparent={true} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      {clicked && (
        <Html position={[0, 0, 0]} distanceFactor={15} zIndexRange={[100, 0]}>
          <div className="bg-gray-900/95 text-white p-4 rounded-lg border border-blue-500/30 w-64 backdrop-blur-md shadow-[0_0_20px_rgba(59,130,246,0.3)] animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xs font-bold text-blue-300 tracking-widest">TO: {message.recipient.toUpperCase()}</h3>
              <button onClick={(e) => { e.stopPropagation(); setClicked(false); }} className="text-gray-400 hover:text-white text-xs">✕</button>
            </div>
            <p className="text-sm font-serif italic text-gray-100 leading-relaxed">"{message.content}"</p>
          </div>
        </Html>
      )}
    </group>
  );
};

// --- Component: Falling Star System ---
const FallingStarSystem = ({ messages, texture }) => {
  const [activeStar, setActiveStar] = useState(null);
  const [caught, setCaught] = useState(false);
  const meshRef = useRef();

  useEffect(() => {
    if (activeStar || messages.length === 0) return;

    const timeout = setTimeout(() => {
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      
      const startPhi = Math.random() * Math.PI * 0.5;
      const startTheta = Math.random() * Math.PI * 2;
      const startPos = new THREE.Vector3().setFromSphericalCoords(40, startPhi, startTheta);
      
      const endPos = new THREE.Vector3().copy(startPos).add(
        new THREE.Vector3((Math.random() - 0.5) * 30, -(Math.random() * 30 + 10), (Math.random() - 0.5) * 30)
      );

      setActiveStar({
        message: randomMsg,
        startPos: startPos,
        endPos: endPos,
        startTime: Date.now()
      });
      setCaught(false);
    }, Math.random() * 5000 + 3000);

    return () => clearTimeout(timeout);
  }, [activeStar, messages]);

  useFrame(() => {
    if (!activeStar || caught || !meshRef.current) return;

    const now = Date.now();
    const duration = 2000;
    const elapsed = now - activeStar.startTime;
    const progress = elapsed / duration;

    if (progress >= 1) {
      setActiveStar(null);
    } else {
      meshRef.current.position.lerpVectors(activeStar.startPos, activeStar.endPos, progress);
      meshRef.current.scale.set(0.5, 0.5, 2);
      meshRef.current.lookAt(activeStar.endPos);
    }
  });

  if (!activeStar) return null;

  return (
    <group>
      {!caught && (
        <mesh 
          ref={meshRef} 
          onClick={(e) => { e.stopPropagation(); setCaught(true); }}
          onPointerOver={() => { document.body.style.cursor = 'crosshair'; }}
          onPointerOut={() => { document.body.style.cursor = 'default'; }}
        >
          <cylinderGeometry args={[0.1, 0.4, 4, 8]} rotation={[Math.PI / 2, 0, 0]} />
          <meshBasicMaterial color="#aaddff" transparent opacity={0.8} />
        </mesh>
      )}

      {caught && (
        <Html position={activeStar.startPos} center>
           <div className="bg-slate-900/95 text-white p-6 rounded-xl border border-cyan-400 w-72 backdrop-blur-xl shadow-[0_0_50px_rgba(34,211,238,0.4)] animate-in zoom-in duration-300">
            <h2 className="text-cyan-400 font-bold uppercase tracking-widest text-xs mb-2">✨ Falling Star Caught!</h2>
            <div className="border-l-2 border-cyan-500/50 pl-3 mb-3">
              <p className="text-xs text-gray-400 font-mono">TO: {activeStar.message.recipient}</p>
            </div>
            <p className="text-lg font-serif italic text-white mb-4">"{activeStar.message.content}"</p>
            <button 
              onClick={() => setActiveStar(null)}
              className="w-full py-2 bg-cyan-900/50 hover:bg-cyan-800/50 rounded transition-colors text-xs uppercase tracking-widest"
            >
              Release to Sky
            </button>
          </div>
        </Html>
      )}
    </group>
  );
};

// --- Main Component ---
const NightSky = () => {
  const [messages, setMessages] = useState(mockMessages);
  const [isWriting, setIsWriting] = useState(false);
  const starTexture = useStarTexture();

  const stars = useMemo(() => messages.filter(m => m.type === 'star'), [messages]);
  const fallingStars = useMemo(() => messages.filter(m => m.type === 'falling_star'), [messages]);

  const handleSendMessage = (data) => {
    const newMessage = {
      id: Date.now(),
      recipient: data.recipient,
      content: data.message,
      type: data.type,
      size: Math.random() * 0.5 + 0.3,
      color: data.type === 'star' ? 'white' : '#aaddff',
      position: data.type === 'star' ? getRandomPositionOnSphere(45) : null 
    };

    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <Canvas camera={{ position: [0, 0, 0.1], fov: 75 }}>
        <CameraZoomHandler />
        <ambientLight intensity={0.5} />
        
        {stars.map((msg) => (
          <MessageStar 
            key={msg.id}
            position={msg.position}
            message={msg}
            baseSize={msg.size * 2}
            color={msg.color}
            texture={starTexture}
          />
        ))}

        <FallingStarSystem messages={fallingStars} texture={starTexture} />

        <OrbitControls enableZoom={false} enablePan={false} enableDamping={true} dampingFactor={0.05} rotateSpeed={0.4} reverseOrbit={true} />
      </Canvas>

      {/* --- UI Components --- */}
      <ComposeModal 
        isOpen={isWriting} 
        onClose={() => setIsWriting(false)} 
        onSend={handleSendMessage} 
      />

      <HUD onOpenCompose={() => setIsWriting(true)} />
    </div>
  );
};

export default NightSky;