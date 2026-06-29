"use client";

import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

function OuterMesh() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime() * 0.08;
    // Parallax tilt based on pointer coordinates
    const targetX = state.pointer.y * 0.35;
    const targetY = state.pointer.x * 0.35;

    meshRef.current.rotation.x = THREE.MathUtils.lerp(
      meshRef.current.rotation.x,
      targetX + time,
      0.05
    );
    meshRef.current.rotation.y = THREE.MathUtils.lerp(
      meshRef.current.rotation.y,
      targetY + time * 1.2,
      0.05
    );
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[2.0, 1]} />
      <meshBasicMaterial color="#f5a623" wireframe />
    </mesh>
  );
}

function InnerMesh() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime() * -0.12;
    const targetX = state.pointer.y * -0.2;
    const targetY = state.pointer.x * -0.2;

    meshRef.current.rotation.x = THREE.MathUtils.lerp(
      meshRef.current.rotation.x,
      targetX + time,
      0.05
    );
    meshRef.current.rotation.y = THREE.MathUtils.lerp(
      meshRef.current.rotation.y,
      targetY + time * 1.5,
      0.05
    );
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.1, 1]} />
      <meshBasicMaterial color="#ffffff" wireframe />
    </mesh>
  );
}

export default function ThreeScene() {
  return (
    <div className="w-full h-full min-h-[400px] flex items-center justify-center pointer-events-none select-none">
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 40 }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.5} />
        <OuterMesh />
        <InnerMesh />
      </Canvas>
    </div>
  );
}
