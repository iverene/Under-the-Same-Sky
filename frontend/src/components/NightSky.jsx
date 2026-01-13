import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Stars, Sparkles, Float } from '@react-three/drei';
import * as THREE from 'three';
import { fetchMessages, sendMessage } from '../api';
import ComposeModal from './ComposeModal';
import WishingModal from './WishingModal';
import LanternViewModal from './LanternViewModal';
import HUD from './HUD';
import TopBar from './TopBar';

// --- DEBUG COMPONENT ---
const DebugConsole = ({ messages, error }) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed top-20 left-4 z-50 bg-red-600 text-white text-xs px-2 py-1 rounded shadow-lg opacity-80 hover:opacity-100"
      >
        🐞 Debug
      </button>
    );
  }

  return (
    <div className="fixed top-20 left-4 z-50 w-80 max-h-[80vh] overflow-y-auto bg-black/90 text-green-400 font-mono text-[10px] p-4 border border-green-500/30 rounded shadow-2xl backdrop-blur-md">
      <div className="flex justify-between items-center mb-2 border-b border-green-500/30 pb-2">
        <h3 className="font-bold">DEBUG CONSOLE</h3>
        <button onClick={() => setIsOpen(false)} className="text-red-400 hover:text-red-200">Close</button>
      </div>

      {error && (
        <div className="bg-red-900/50 p-2 mb-2 rounded border border-red-500 text-white">
          <strong>ERROR:</strong> {error}
        </div>
      )}

      <div className="mb-2">
        Total Messages: <span className="text-white">{messages.length}</span>
      </div>

      <div className="space-y-1">
        {messages.map((msg, i) => {
          const hasPos = msg.position && !isNaN(msg.position.x);
          return (
            <div key={i} className={`p-1 border-l-2 ${hasPos ? 'border-green-500' : 'border-red-500 bg-red-900/20'}`}>
              <div className="text-gray-400">ID: <span className="text-white">{msg.id}</span> | {msg.type}</div>
              <div className="truncate text-gray-500">"{msg.content}"</div>
              <div className={hasPos ? 'text-blue-300' : 'text-red-400 font-bold'}>
                {hasPos 
                  ? `Pos: [${msg.position.x.toFixed(1)}, ${msg.position.y.toFixed(1)}, ${msg.position.z.toFixed(1)}]`
                  : 'MISSING COORDINATES'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

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
      // UPDATED: Made star texture more opaque/solid for better visibility
      star: createTexture([[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(220,240,255,0.9)'], [1, 'rgba(0,0,0,0)']]),
      lantern: createTexture([[0, 'rgba(255,200,50,1)'], [0.4, 'rgba(255,100,0,0.8)'], [1, 'rgba(0,0,0,0)']])
    };
  }, []);
};

// --- Component: Zoom Handler (Optional but helpful) ---
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

// --- Component: Star Beacon ---
const MessageBeacon = ({ position, message, texture }) => {
  const [clicked, setClicked] = useState(false);
  const [hovered, setHovered] = useState(false);
  const spriteRef = useRef();
  
  const numericId = useMemo(() => {
    if (typeof message.id === 'string') return message.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    return Number(message.id) || 0;
  }, [message.id]);

  useFrame(({ clock }) => {
    if (!spriteRef.current) return;
    const t = clock.getElapsedTime();
    // UPDATED: Increased base scale so stars are visible at distance
    const scale = hovered ? 4.5 : 2.5 * (Math.sin(t * 1.5 + numericId) * 0.2 + 0.9); 
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

      {/* UPDATED: Added Beacon Line for visibility */}
      <line>
        <bufferGeometry attach="geometry" {...new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -position.y - 50, 0)])} />
        <lineBasicMaterial attach="material" color="white" transparent opacity={0.15} />
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
  const speed = useMemo(() => 0.002 + Math.random() * 0.003, []);
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.y += speed;
      meshRef.current.rotation.y += 0.002;
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

// --- Component: Interactive Falling Star ---
const FallingStarSystem = ({ messages }) => {
  const [activeStar, setActiveStar] = useState(null);
  const [caught, setCaught] = useState(false);
  const [queue, setQueue] = useState([]); 
  const meshRef = useRef();

  useEffect(() => {
    if (messages.length === 0) return;
    if (queue.length === 0) {
       const shuffled = [...messages].sort(() => Math.random() - 0.5);
       setQueue(shuffled);
    }
  }, [messages, queue.length]);

  useEffect(() => {
    if (activeStar || queue.length === 0) return;

    const timeout = setTimeout(() => {
      const nextQueue = [...queue];
      const nextMsg = nextQueue.pop();
      setQueue(nextQueue);

      const startPos = new THREE.Vector3((Math.random()-0.5)*50, 40, (Math.random()-0.5)*50);
      const endPos = new THREE.Vector3((Math.random()-0.5)*50, -40, (Math.random()-0.5)*50);
      
      setActiveStar({ message: nextMsg, startPos, endPos, startTime: Date.now() });
      setCaught(false);
    }, Math.random() * 5000 + 5000); 
    
    return () => clearTimeout(timeout);
  }, [activeStar, queue]);

  useFrame(() => {
    if (!activeStar || caught || !meshRef.current) return;
    const now = Date.now();
    const progress = (now - activeStar.startTime) / 2000; 
    
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

// --- Main Scene ---
const NightSky = () => {
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null); // Debug Error State

  const [isWriting, setIsWriting] = useState(false);
  const [isWishing, setIsWishing] = useState(false);
  const [selectedLantern, setSelectedLantern] = useState(null);
  
  const textures = useTextures();

  useEffect(() => {
    fetchMessages()
      .then(data => {
        const processed = data.map(msg => {
          let pos = null;
          // UPDATED: Check BOTH flat and nested props
          const x = msg.position?.x ?? msg.position_x;
          const y = msg.position?.y ?? msg.position_y;
          const z = msg.position?.z ?? msg.position_z;

          if (x != null && y != null && z != null) {
            // Create Vector3. For Stars, we scale them out. Lanterns use raw DB pos.
            pos = new THREE.Vector3(Number(x), Number(y), Number(z));
            if (msg.type === 'star') pos.multiplyScalar(0.8); 
          } else {
            // UPDATED: Generate random fallback if missing
            const r = 40 + Math.random() * 20; 
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            pos = new THREE.Vector3().setFromSphericalCoords(r, phi, theta);
          }
          return { ...msg, position: pos };
        });
        setMessages(processed);
      })
      .catch(err => {
        console.error("Fetch Error:", err);
        setError(err.message);
      });
  }, []);

  const handleSendMessage = async (data) => {
    try {
      const payload = {
         recipient: data.recipient || data.name,
         message: data.message || data.wish,
         type: data.type
      };
      await sendMessage(payload);
      window.location.reload(); 
    } catch (e) { 
        console.error(e);
        setError(e.message);
    }
  };

  const stars = useMemo(() => messages.filter(m => m.type === 'star'), [messages]);
  const lanterns = useMemo(() => messages.filter(m => m.type === 'lantern'), [messages]);
  const fallingStars = useMemo(() => messages.filter(m => m.type === 'falling_star' || m.type === 'star'), [messages]);

  return (
    <div className="relative w-full h-screen bg-black text-white overflow-hidden">
      {/* ADDED: Debug Console */}
      <DebugConsole messages={messages} error={error} />

      <Canvas camera={{ position: [0, 5, 30], fov: 50 }}>
        <CameraZoomHandler />
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

        {/* Render Falling Stars */}
        <FallingStarSystem messages={fallingStars} />

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