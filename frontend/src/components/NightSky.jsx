import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { mockMessages, getRandomPositionOnSphere } from '../data/mockMessages';
import ComposeModal from './ComposeModal';
import WishingModal from './WishingModal'; 
import HUD from './HUD';

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
      e.preventDefault();
      const zoomSpeed = 0.05;
      const newFov = Math.max(10, Math.min(90, camera.fov + e.deltaY * zoomSpeed));
      camera.fov = newFov;
      camera.updateProjectionMatrix();
    };
    const canvasElement = document.querySelector('canvas');
    if (canvasElement) canvasElement.addEventListener('wheel', handleWheel, { passive: false });
    return () => canvasElement?.removeEventListener('wheel', handleWheel);
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
        <Html position={[0, 0, 0]} distanceFactor={12} zIndexRange={[100, 0]}>
          <div className="relative group">
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-[1px] h-8 bg-gradient-to-t from-white/50 to-transparent"></div>
            <div className="bg-slate-950/80 backdrop-blur-xl border border-white/10 p-6 rounded-xl w-72 shadow-[0_0_40px_rgba(255,255,255,0.1)] animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-start mb-4 border-b border-white/5 pb-2">
                <div>
                  <h3 className="text-[10px] font-bold text-blue-200 uppercase tracking-[0.2em]">Addressed To</h3>
                  <p className="text-white font-serif text-lg leading-none mt-1">{message.recipient}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setClicked(false); }} className="text-slate-500 hover:text-white transition-colors p-1">✕</button>
              </div>
              <div className="relative">
                <span className="absolute -top-2 -left-1 text-4xl text-white/10 font-serif">“</span>
                <p className="text-sm font-serif text-slate-300 leading-relaxed italic pl-4 relative z-10">{message.content}</p>
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// --- Component: Floating Lantern ---
const FloatingLantern = ({ position, message }) => {
  const meshRef = useRef();
  const [clicked, setClicked] = useState(false);

  // Lanterns float upwards slowly
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const time = clock.getElapsedTime();
      // Gentle float up
      meshRef.current.position.y += 0.005; 
      // Gentle wobble
      meshRef.current.position.x += Math.sin(time + message.id) * 0.002;
      meshRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group position={position}>
      <mesh 
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); setClicked(!clicked); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
      >
        <cylinderGeometry args={[0.2, 0.3, 0.6, 8]} />
        <meshStandardMaterial color="#ffaa00" emissive="#ff5500" emissiveIntensity={2} transparent opacity={0.9} />
      </mesh>
      
      {/* Lantern Light Glow */}
      <pointLight distance={3} intensity={2} color="#ffaa00" />

      {clicked && (
        <Html position={[0, 0, 0]} distanceFactor={12} zIndexRange={[100, 0]}>
          <div className="bg-slate-900/90 backdrop-blur-xl border border-amber-500/30 p-6 rounded-xl w-64 shadow-[0_0_30px_rgba(245,158,11,0.2)] animate-in zoom-in duration-300">
             <div className="text-center">
                <div className="text-amber-500 text-2xl mb-2">🏮</div>
                <h3 className="text-[10px] font-bold text-amber-200 uppercase tracking-widest mb-1">A Wish For</h3>
                <p className="font-serif text-white text-lg mb-4">{message.recipient}</p>
                <p className="text-sm font-serif italic text-amber-100/80">"{message.content}"</p>
                <button onClick={(e) => { e.stopPropagation(); setClicked(false); }} className="mt-4 text-xs text-amber-500/60 hover:text-amber-500">Close</button>
             </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// --- Component: Falling Star System ---
const FallingStarSystem = ({ messages }) => {
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
      const endPos = new THREE.Vector3().copy(startPos).add(new THREE.Vector3((Math.random() - 0.5) * 30, -(Math.random() * 30 + 10), (Math.random() - 0.5) * 30));
      setActiveStar({ message: randomMsg, startPos, endPos, startTime: Date.now() });
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
           <div className="bg-cyan-950/90 backdrop-blur-xl text-white p-8 rounded-2xl border border-cyan-400/30 w-80 shadow-[0_0_60px_rgba(34,211,238,0.2)] animate-in zoom-in duration-300">
            <div className="flex flex-col items-center text-center">
              <div className="text-3xl mb-2">✨</div>
              <h2 className="text-cyan-300 font-bold uppercase tracking-widest text-xs mb-6">Falling Star Caught</h2>
              <div className="w-full bg-black/20 rounded-lg p-4 mb-4 border border-cyan-500/10">
                <p className="text-xs text-cyan-200/60 uppercase tracking-wider mb-1">For</p>
                <p className="font-serif text-xl text-white">{activeStar.message.recipient}</p>
              </div>
              <p className="text-lg font-serif italic text-cyan-100/90 mb-6 leading-relaxed">"{activeStar.message.content}"</p>
              <button onClick={() => setActiveStar(null)} className="px-6 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-full transition-colors text-xs uppercase tracking-widest text-cyan-300">Release to Sky</button>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// --- Main Component ---
const NightSky = () => {
  const [messages, setMessages] = useState(mockMessages);
  
  // 2. States for both modals
  const [isWriting, setIsWriting] = useState(false);
  const [isWishing, setIsWishing] = useState(false);
  
  const starTexture = useStarTexture();

  // Filter messages by type
  const stars = useMemo(() => messages.filter(m => m.type === 'star'), [messages]);
  const fallingStars = useMemo(() => messages.filter(m => m.type === 'falling_star'), [messages]);
  const lanterns = useMemo(() => messages.filter(m => m.type === 'lantern'), [messages]);

  // 3. Updated Handler to support both Modal data formats
  const handleSendMessage = (data) => {
    const newMessage = {
      id: Date.now(),
      // Wishing Modal sends 'name'/'wish', Compose Modal sends 'recipient'/'message'
      recipient: data.recipient || data.name, 
      content: data.message || data.wish,
      type: data.type,
      size: Math.random() * 0.5 + 0.3,
      color: data.type === 'lantern' ? '#ffaa00' : (data.type === 'falling_star' ? '#aaddff' : 'white'),
      // Lanterns need a start position lower down
      position: data.type === 'lantern' 
        ? new THREE.Vector3((Math.random() - 0.5) * 20, -10, (Math.random() - 0.5) * 20) 
        : (data.type === 'star' ? getRandomPositionOnSphere(45) : null)
    };

    setMessages(prev => [...prev, newMessage]);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      <Canvas camera={{ position: [0, 0, 0.1], fov: 75 }}>
        <CameraZoomHandler />
        <ambientLight intensity={0.5} />
        
        {/* Render Stars */}
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

        {/* Render Lanterns (New) */}
        {lanterns.map((msg) => (
          <FloatingLantern 
            key={msg.id}
            position={msg.position || new THREE.Vector3(0, -10, -20)} // Fallback position
            message={msg}
          />
        ))}

        {/* Render Falling Stars */}
        <FallingStarSystem messages={fallingStars} />

        <OrbitControls enableZoom={false} enablePan={false} enableDamping={true} dampingFactor={0.05} rotateSpeed={0.4} reverseOrbit={true} />
      </Canvas>

      {/* --- UI Components --- */}
      <ComposeModal 
        isOpen={isWriting} 
        onClose={() => setIsWriting(false)} 
        onSend={handleSendMessage} 
      />

      {/* 4. Render the Wishing Modal */}
      <WishingModal
        isOpen={isWishing}
        onClose={() => setIsWishing(false)}
        onSend={handleSendMessage}
      />

      {/* 5. Pass handlers to HUD */}
      <HUD 
        onOpenCompose={() => setIsWriting(true)} 
        onOpenWish={() => setIsWishing(true)} 
      />
    </div>
  );
};

export default NightSky;