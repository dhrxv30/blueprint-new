// src/components/landing/DependencyGraph3D.tsx
import { useRef, useMemo, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
// Removed Stars from the import here
import { OrbitControls, Line, Float, Text, Billboard } from "@react-three/drei";
import * as THREE from "three";

const NUM_NODES = 60; 
const RADIUS = 6.5;   

const NODE_LABELS = [
  "API Gateway", "Auth Service", "Users DB", "Payment API", 
  "Redis Cache", "Search Service", "Message Queue", "Worker Node", 
  "Analytics", "Blob Storage", "Notifications", "Logging"
];

const generateNodes = () => {
  const nodes = [];
  const phi = Math.PI * (3 - Math.sqrt(5)); 

  for (let i = 0; i < NUM_NODES; i++) {
    const y = 1 - (i / (NUM_NODES - 1)) * 2; 
    const radiusAtY = Math.sqrt(1 - y * y); 
    const theta = phi * i; 

    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;

    nodes.push({
      position: new THREE.Vector3(x * RADIUS, y * RADIUS, z * RADIUS),
      label: NODE_LABELS[i % NODE_LABELS.length]
    });
  }
  return nodes;
};

const InteractiveNode = ({ position, label }: { position: THREE.Vector3, label: string }) => {
  const [hovered, setHovered] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      const targetScale = hovered ? 1.5 + Math.sin(state.clock.elapsedTime * 5) * 0.1 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.1);
    }
  });

  return (
    <group position={position}>
      <mesh 
        ref={meshRef}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
        onPointerOut={() => setHovered(false)}
      >
        <icosahedronGeometry args={[0.08, 1]} />
        <meshStandardMaterial 
          color={hovered ? "#ffffff" : "#ff4500"} 
          emissive={hovered ? "#ffffff" : "#ff4500"} 
          emissiveIntensity={hovered ? 2 : 1.5} 
          wireframe={hovered} 
        />
      </mesh>
      
      {hovered && (
        <Billboard position={[0, -0.4, 0]}>
          <Text 
            fontSize={0.2} 
            color="#ffffff" 
            anchorX="center" 
            anchorY="middle"
          >
            {label}
          </Text>
        </Billboard>
      )}
    </group>
  );
};

const NetworkGraph = () => {
  const groupRef = useRef<THREE.Group>(null);
  const nodes = useMemo(() => generateNodes(), []);

  const lines = useMemo(() => {
    const connections = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].position.distanceTo(nodes[j].position) < RADIUS * 1.6) {
          connections.push([nodes[i].position, nodes[j].position]);
        }
      }
    }
    return connections;
  }, [nodes]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
      groupRef.current.rotation.x += 0.0003;
    }
  });

  return (
    <Float speed={1} rotationIntensity={0.1} floatIntensity={0.1}>
      <group ref={groupRef}>
        {nodes.map((node, i) => (
          <InteractiveNode key={`node-${i}`} position={node.position} label={node.label} />
        ))}
        {lines.map((pts, i) => (
          <Line key={`line-${i}`} points={pts} color="#ff4500" lineWidth={1} transparent opacity={0.15} />
        ))}
      </group>
    </Float>
  );
};

export default function DependencyGraph3D() {
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas camera={{ position: [0, 0, 16], fov: 45 }}>
        {/* The background stars have been removed! */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1.5} color="#ffffff" />
        <NetworkGraph />
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}