import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Stars, Sparkles, Float } from '@react-three/drei';
import * as THREE from 'three';
import { fetchMessages, sendMessage } from '../api';
import ComposeModal from './ComposeModal';
import HUD from './HUD';

// --- 1. Texture Assets ---
const useBeaconTexture = () => {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // Core glow (Star-like)
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(220, 240, 255, 0.9)'); 
    gradient.addColorStop(0.5, 'rgba(100, 200, 255, 0.3)'); 
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
  }, []);
};

// --- 2. Message Beacon (The Star) ---
const MessageBeacon = ({ position, message, texture }) => {
  const [clicked, setClicked] = useState(false);
  const [hovered, setHovered] = useState(false);
  const spriteRef = useRef();
  
  // Stable ID for animation
  const numericId = useMemo(() => {
    if (typeof message.id === 'string') {
      return message.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    }
    return Number(message.id) || 0;
  }, [message.id]);

  useFrame(({ clock }) => {
    if (!spriteRef.current) return;
    const t = clock.getElapsedTime();
    
    // Gentle twinkling
    const twinkle = Math.sin(t * 1.5 + numericId) * 0.2 + 0.9; 
    const scale = hovered ? 3.5 : 2.0 * twinkle; 
    
    spriteRef.current.scale.set(scale, scale, 1);
    
    // Subtle color shift (Blue/White/Cyan)
    spriteRef.current.material.color.setHSL((t * 0.02 + numericId * 0.1) % 1, 0.6, 0.9);
  });

  return (
    <group position={position}>
      {/* The Star Sprite */}
      <sprite
        ref={spriteRef}
        onClick={(e) => { e.stopPropagation(); setClicked(!clicked); }}
        onPointerOver={() => { document.body.style.cursor = 'pointer'; setHovered(true); }}
        onPointerOut={() => { document.body.style.cursor = 'default'; setHovered(false); }}
      >
        <spriteMaterial map={texture} transparent blending={THREE.AdditiveBlending} depthWrite={false} />
      </sprite>

      {/* Anchor Line: Connects star to the "horizon" visually */}
      <line>
        <bufferGeometry attach="geometry" {...new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -position.y - 10, 0)])} />
        <lineBasicMaterial attach="material" color="white" transparent opacity={0.03} />
      </line>

      {/* Popup UI */}
      {clicked && (
        <Html distanceFactor={20} zIndexRange={[100, 0]}>
          <div className="w-64 bg-slate-900/90 border border-blue-500/30 text-white p-4 rounded-xl backdrop-blur-md shadow-[0_0_30px_rgba(0,100,255,0.2)] animate-in fade-in zoom-in duration-200">
            <h3 className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mb-2 border-b border-white/10 pb-1">Star Registry</h3>
            <div className="text-sm text-blue-100 mb-1">To: <span className="font-serif text-white text-lg">{message.recipient}</span></div>
            <p className="text-sm text-gray-300 italic leading-relaxed">"{message.content}"</p>
            <button 
              className="absolute top-2 right-2 text-gray-500 hover:text-white transition-colors"
              onClick={(e) => { e.stopPropagation(); setClicked(false); }}
            >✕</button>
          </div>
        </Html>
      )}
    </group>
  );
};

// --- 3. Main Scene ---
const NightSky = () => {
  const [messages, setMessages] = useState([]);
  const [isWriting, setIsWriting] = useState(false);
  const beaconTexture = useBeaconTexture();

  useEffect(() => {
    fetchMessages().then(data => {
      // Process Data
      const processed = data.map(msg => {
        let pos = null;
        if (msg.position && typeof msg.position.x === 'number') {
          // Spread them out more for the "Sky" view (Radius ~40)
          pos = new THREE.Vector3(msg.position.x, msg.position.y, msg.position.z).normalize().multiplyScalar(40);
        }
        return { ...msg, position: pos };
      });
      setMessages(processed);
    });
  }, []);

  const handleSendMessage = async (data) => {
    try {
      await sendMessage(data);
      window.location.reload(); 
    } catch (e) { console.error(e); }
  };

  const stars = useMemo(() => messages.filter(m => m.type === 'star' && m.position), [messages]);

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden">
      <Canvas camera={{ position: [0, 10, 30], fov: 50 }}>
        
        {/* --- ATMOSPHERE --- */}
        {/* Dark Blue-Black Night Sky */}
        <color attach="background" args={['#020205']} />
        {/* Fog at the bottom to simulate horizon/atmosphere */}
        <fog attach="fog" args={['#020205', 10, 90]} />
        
        {/* Thousands of distant background stars */}
        <Stars radius={100} depth={50} count={7000} factor={4} saturation={0} fade speed={0.5} />
        
        {/* Subtle floating dust/fireflies */}
        <Sparkles count={300} scale={60} size={2} speed={0.2} opacity={0.3} color="#aaddff" />

        {/* --- LIGHTING --- */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />

        {/* --- CONTENT --- */}
        <Float speed={0.5} rotationIntensity={0.2} floatIntensity={0.5}>
          {stars.map((msg) => (
            <MessageBeacon 
              key={msg.id}
              position={msg.position}
              message={msg}
              texture={beaconTexture}
            />
          ))}
        </Float>

        {/* --- CONTROLS --- */}
        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          minDistance={10} 
          maxDistance={60}
          // Prevent going "underground"
          maxPolarAngle={Math.PI / 2 - 0.05} 
          // Slow, cinematic rotation
          autoRotate={true}
          autoRotateSpeed={0.3}
        />
        
      </Canvas>

      <ComposeModal isOpen={isWriting} onClose={() => setIsWriting(false)} onSend={handleSendMessage} />
      <HUD onOpenCompose={() => setIsWriting(true)} />
    </div>
  );
};

export default NightSky;