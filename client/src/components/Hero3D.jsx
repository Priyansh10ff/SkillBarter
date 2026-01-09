import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, Line, Html, Float, Stars } from "@react-three/drei";
import * as THREE from "three";

const NetworkGlobe = () => {
  const groupRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.15;
    groupRef.current.rotation.x = Math.cos(t * 0.2) * 0.1;
  });

  return (
    <group ref={groupRef} scale={2.2}>
      {/* Core Dark Sphere */}
      <Sphere args={[1, 32, 32]}>
        <meshStandardMaterial color="#1e1b4b" roughness={0.7} metalness={0.5} />
      </Sphere>

      {/* Wireframe Network Layer */}
      <Sphere args={[1.05, 16, 16]}>
        <meshBasicMaterial color="#6366f1" wireframe transparent opacity={0.3} />
      </Sphere>

      {/* Glowing Nodes (Skills) */}
      {[...Array(8)].map((_, i) => (
        <mesh key={i} position={[
          Math.sin(i) * 1.2,
          Math.cos(i * 2) * 1.2,
          Math.cos(i) * 1.2
        ]}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshBasicMaterial color="#a855f7" />
        </mesh>
      ))}
      
      {/* Outer Floating Rings */}
      <group rotation={[Math.PI / 3, 0, 0]}>
         <line>
            <ringGeometry args={[1.6, 1.62, 64]} />
            <meshBasicMaterial color="#4f46e5" transparent opacity={0.2} side={THREE.DoubleSide} />
         </line>
      </group>
    </group>
  );
};

const Hero3D = () => {
  return (
    <div className="h-[500px] w-full cursor-move">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={2} color="#818cf8" />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#c084fc" />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
          <NetworkGlobe />
        </Float>
        
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
};

export default Hero3D;