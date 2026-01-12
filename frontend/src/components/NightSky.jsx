import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Stars, Sparkles, Float } from '@react-three/drei';
import * as THREE from 'three';
import { fetchMessages, sendMessage } from '../api';
import ComposeModal from './ComposeModal';
import WishingModal from './WishingModal';
import LanternViewModal from './LanternViewModal';
import HUD from './HUD';
import TopBar from './TopBar';

// --- Assets: Texture Generators ---
const useTextures = () => {
  return useMemo(() => {
    const createTexture = (colorStops) => {
      const canvas = document.createElement('canvas');
      canvas.width = 64; canvas.height = 64;
      const ctx = canvas.getContext('2d');
      const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      colorStops.forEach(([stop, color]) => gradient.addColorStop(stop, color));
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 64, 64);
      return new THREE.CanvasTexture(canvas);
    };

    return {
      star: createTexture([[0, 'rgba(255,255,255,1)'], [0.2, 'rgba(200,240,255,0.8)'], [1, 'rgba(0,0,0,0)']]),
      lantern: createTexture([[0, 'rgba(255,200,50,1)'], [0.4, 'rgba(255,100,0,0.8)'], [1, 'rgba(0,0,0,0)']])
    };
  }, []);
};

// --- Component: Star Beacon ---
const MessageBeacon = ({ position, message, texture }) => {
  const [clicked, setClicked] = useState(false);
  const [hovered, setHovered] = useState(false);
  const spriteRef = useRef();
  
  // Stable ID
  const numericId = useMemo(() => {
    if (typeof message.id === 'string') return message.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return Number(message.id) || 0;
  }, [message.id]);

  useFrame(({ clock }) => {
    if (!spriteRef.current) return;
    const t = clock.getElapsedTime();
    const scale = hovered ? 3.5 : 2.0 * (Math.sin(t * 1.5 + numericId) * 0.2 + 0.9); 
    spriteRef.current.scale.set(scale, scale, 1);
    spriteRef.current.material.color.setHSL((t * 0.02 + numericId * 0.1) % 1, 0.6, 0.9);
  });

  return (
    <group position={position}>
      <sprite
        ref={spriteRef}
        onClick={(e) => { e.stopPropagation(); setClicked(!clicked); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; setHovered(true); }}
        onPointerOut={() => { document.body.style.cursor = 'default'; setHovered(false); }}
      >
        <spriteMaterial map={texture} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>

      <line>
        <bufferGeometry attach="geometry" {...new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -position.y - 10, 0)])} />
        <lineBasicMaterial attach="material" color="white" transparent opacity={0.03} />
      </line>

      {clicked && (
        <Html distanceFactor={20} zIndexRange={[100, 0]}>
          <div className="w-64 bg-slate-900/90 border border-blue-500/30 text-white p-4 rounded-xl backdrop-blur-md animate-in fade-in zoom-in duration-200">
            <h3 className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-2 border-b border-white/10 pb-1">Star Registry</h3>
            <div className="text-sm text-blue-100 mb-1">To: <span className="font-serif text-white text-lg">{message.recipient}</span></div>
            <p className="text-sm text-gray-300 italic">"{message.content}"</p>
            <button className="absolute top-2 right-2 text-gray-500 hover:text-white" onClick={(e) => { e.stopPropagation(); setClicked(false); }}>✕</button>
          </div>
        </Html>
      )}
    </group>
  );
};

// --- Component: Floating Lantern ---
const FloatingLantern = ({ position, message, onSelect }) => {
  const meshRef = useRef();
  // Random float speed
  const speed = useMemo(() => 0.002 + Math.random() * 0.003, []);
  
  useFrame(() => {
    if (meshRef.current) {
      // Float Upwards constantly
      meshRef.current.position.y += speed;
      // Gentle rotation
      meshRef.current.rotation.y += 0.002;
      // If it goes too high, visual reset (optional, but good for long sessions)
      if (meshRef.current.position.y > 60) meshRef.current.position.y = -20;
    }
  });

  return (
    <group position={position} ref={meshRef}>
      <mesh 
        onClick={(e) => { e.stopPropagation(); onSelect(message); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { document.body.style.cursor = 'default'; }}
      >
        <cylinderGeometry args={[0.2, 0.3, 0.6, 8]} />
        <meshStandardMaterial color="#ffaa00" emissive="#ff5500" emissiveIntensity={2} transparent opacity={0.9} />
      </mesh>
      <pointLight distance={5} intensity={1.5} color="#ffaa00" decay={2} />
    </group>
  );
};

// --- Main Scene ---
const NightSky = () => {
  const [messages, setMessages] = useState([]);
  const [isWriting, setIsWriting] = useState(false);
  const [isWishing, setIsWishing] = useState(false);
  const [selectedLantern, setSelectedLantern] = useState(null);
  
  const textures = useTextures();

  useEffect(() => {
    fetchMessages().then(data => {
      const processed = data.map(msg => {
        let pos = null;
        if (msg.position && typeof msg.position.x === 'number') {
           // Create Vector3. For Stars, we scale them out. Lanterns use raw DB pos.
           pos = new THREE.Vector3(msg.position.x, msg.position.y, msg.position.z);
           if (msg.type === 'star') pos.multiplyScalar(0.8); 
        }
        return { ...msg, position: pos };
      });
      setMessages(processed);
    });
  }, []);

  const handleSendMessage = async (data) => {
    try {
      // Data from WishingModal comes as { name, wish, type: 'lantern' }
      // Data from ComposeModal comes as { recipient, message, type: 'star' }
      const payload = {
         recipient: data.recipient || data.name,
         message: data.message || data.wish,
         type: data.type
      };
      
      await sendMessage(payload);
      window.location.reload(); 
    } catch (e) { console.error(e); }
  };

  const stars = useMemo(() => messages.filter(m => m.type === 'star' && m.position), [messages]);
  const lanterns = useMemo(() => messages.filter(m => m.type === 'lantern' && m.position), [messages]);

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden">
      <Canvas camera={{ position: [0, 5, 30], fov: 50 }}>
        
        {/* Environment */}
        <color attach="background" args={['#020205']} />
        <fog attach="fog" args={['#020205', 10, 80]} />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={0.5} />
        <Sparkles count={300} scale={60} size={2} speed={0.2} opacity={0.3} color="#aaddff" />

        <ambientLight intensity={0.5} />

        {/* Render Stars */}
        <Float speed={0.5} rotationIntensity={0.2} floatIntensity={0.5}>
          {stars.map((msg) => (
            <MessageBeacon 
              key={msg.id}
              position={msg.position}
              message={msg}
              texture={textures.star}
            />
          ))}
        </Float>

        {/* Render Lanterns */}
        {lanterns.map((msg) => (
          <FloatingLantern 
            key={msg.id}
            position={msg.position}
            message={msg}
            onSelect={setSelectedLantern}
          />
        ))}

        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          minDistance={5} 
          maxDistance={60}
          maxPolarAngle={Math.PI / 2 - 0.05} // Keep camera above ground
          autoRotate={true}
          autoRotateSpeed={0.3}
        />
      </Canvas>

      <TopBar />

      <ComposeModal isOpen={isWriting} onClose={() => setIsWriting(false)} onSend={handleSendMessage} />
      <WishingModal isOpen={isWishing} onClose={() => setIsWishing(false)} onSend={handleSendMessage} />
      <LanternViewModal message={selectedLantern} onClose={() => setSelectedLantern(null)} />

      <HUD onOpenCompose={() => setIsWriting(true)} onOpenWish={() => setIsWishing(true)} />
    </div>
  );
};

export default NightSky;