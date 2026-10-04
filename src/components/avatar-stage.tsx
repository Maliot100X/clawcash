import { CameraControls, ContactShadows, Html, Sparkles, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { AnimationMixer, Box3, Vector3, type Group, type Mesh, type PointLight } from "three";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";
import type { Agent } from "@/lib/agents";

type Slot = { x: number; z: number; yaw: number };

function place(index: number, count: number): Slot {
  if (count <= 1) return { x: 0, z: 0, yaw: 0 };
  const arc = count <= 3 ? 0.85 : Math.PI * 0.7;
  const radius = count <= 3 ? 1.7 : 2.35 + count * 0.12;
  const theta = -arc / 2 + (index / (count - 1)) * arc;
  return {
    x: Math.sin(theta) * radius,
    z: (Math.cos(theta) - 1) * radius * 0.42,
    yaw: theta,
  };
}

function Body({
  agent,
  slot,
  lit,
  dim,
  onPick,
}: {
  agent: Agent;
  slot: Slot;
  lit: boolean;
  dim: boolean;
  onPick?: (id: string) => void;
}) {
  const gltf = useGLTF(agent.glb);
  const clone = useMemo(() => cloneSkeleton(gltf.scene), [gltf.scene]);
  const rig = useRef<Group>(null);
  const ring = useRef<Mesh>(null);
  const idle = useRef(false);
  const mixer = useMemo(() => new AnimationMixer(clone), [clone]);

  useLayoutEffect(() => {
    clone.updateMatrixWorld(true);
    const box = new Box3().setFromObject(clone);
    const size = new Vector3();
    box.getSize(size);
    const height = size.y || 1;
    const scale = (1.8 / height) * (agent.fit ?? 1);
    clone.scale.setScalar(scale);
    clone.position.set(0, -box.min.y * scale, 0);
    clone.rotation.y = -slot.yaw * 0.45;
    const clip = gltf.animations.find(
      (item) => /idle|survey|breath|stand/i.test(item.name) && !/walk|run/i.test(item.name),
    );
    idle.current = Boolean(clip);
    if (clip) mixer.clipAction(clip).reset().play();
  }, [agent.fit, clone, gltf.animations, mixer, slot.yaw]);

  useFrame((state, delta) => {
    mixer.update(Math.min(delta, 0.05));
    if (!idle.current && rig.current) {
      rig.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.7 + slot.x) * 0.12;
    }
    if (ring.current) {
      const pulse = lit ? 1 + Math.sin(state.clock.elapsedTime * 3) * 0.08 : 1;
      ring.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group position={[slot.x, 0, slot.z]} scale={dim ? 0.9 : 1}>
      <mesh position={[0, 0.07, 0]}>
        <cylinderGeometry args={[0.48, 0.56, 0.14, 40]} />
        <meshStandardMaterial color={lit ? "#2a211c" : "#161412"} metalness={0.62} roughness={0.32} />
      </mesh>
      <group ref={rig} position={[0, 0.14, 0]}>
        <group
          onClick={(event) => {
            event.stopPropagation();
            onPick?.(agent.id);
          }}
          onPointerOver={(event) => {
            event.stopPropagation();
            if (onPick) document.body.style.cursor = "pointer";
          }}
          onPointerOut={() => {
            document.body.style.cursor = "";
          }}
        >
          <primitive object={clone} />
        </group>
        {lit ? (
          <Html position={[0, 2.05 * (agent.fit ?? 1), 0]} center distanceFactor={7} zIndexRange={[20, 0]}>
            <div className="pointer-events-none rounded-full border border-ember/50 bg-ink/85 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-bone">
              {agent.name}
            </div>
          </Html>
        ) : null}
      </group>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, 0]}>
        <ringGeometry args={[0.36, lit ? 0.5 : 0.44, 48]} />
        <meshBasicMaterial color={agent.color} transparent opacity={lit ? 1 : 0.75} />
      </mesh>
      {lit ? <pointLight position={[0, 1.3, 0.7]} intensity={7} color={agent.color} distance={3.4} /> : null}
    </group>
  );
}

function Sweep() {
  const light = useRef<PointLight>(null);
  useFrame((state) => {
    if (!light.current) return;
    const t = state.clock.elapsedTime * 0.28;
    light.current.position.set(Math.cos(t) * 4.4, 2.4, Math.sin(t) * 2.6);
  });
  return <pointLight ref={light} intensity={16} color="#ff4b1f" distance={12} />;
}

function Stage({
  roster,
  focusId,
  onFocus,
  calm,
}: {
  roster: Agent[];
  focusId: string | null;
  onFocus?: (id: string | null) => void;
  calm: boolean;
}) {
  const controls = useRef<CameraControls>(null);
  const wide = roster.length > 3;
  const slots = useMemo(() => roster.map((_, index) => place(index, roster.length)), [roster]);
  const focusIndex = roster.findIndex((agent) => agent.id === focusId);
  const home = wide ? { x: 0, y: 1.9, z: 9.8 } : { x: 0, y: 1.2, z: 4.8 };

  useEffect(() => {
    const camera = controls.current;
    if (!camera) return;
    if (focusIndex >= 0) {
      const slot = slots[focusIndex];
      if (!slot) return;
      void camera.setLookAt(slot.x * 0.55, 1.42, slot.z + 3.15, slot.x, 1.12, slot.z, true);
      return;
    }
    void camera.setLookAt(home.x, home.y, home.z, 0, 0.95, 0.1, true);
  }, [focusIndex, home.x, home.y, home.z, slots]);

  const disc = wide ? 5.6 : 3.1;

  return (
    <>
      <color attach="background" args={["#09090b"]} />
      <fog attach="fog" args={["#09090b", wide ? 11 : 7, wide ? 22 : 15]} />
      <ambientLight intensity={0.42} />
      <hemisphereLight args={["#f4ede4", "#1a100c", 0.4]} />
      <directionalLight position={[4, 8, 5]} intensity={2.5} color="#fff6ee" />
      <pointLight position={[-3.4, 2.1, 2.2]} intensity={14} color="#ff4b1f" distance={16} />
      <pointLight position={[3.6, 1.7, 1.6]} intensity={8} color="#e8b15a" distance={14} />
      <spotLight position={[0, 6.2, 2.4]} angle={0.85} penumbra={0.8} intensity={12} color="#f4ede4" />
      {calm ? null : <Sweep />}
      {calm ? null : (
        <Sparkles count={70} scale={[12, 3.4, 7]} size={2.4} speed={0.35} color="#ff4b1f" opacity={0.55} position={[0, 1.5, 0]} />
      )}
      {roster.map((agent, index) => {
        const slot = slots[index];
        if (!slot) return null;
        return (
          <Body
            key={agent.id}
            agent={agent}
            slot={slot}
            lit={focusId === agent.id}
            dim={Boolean(focusId) && focusId !== agent.id}
            onPick={onFocus ?? undefined}
          />
        );
      })}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        onClick={() => onFocus?.(null)}
      >
        <circleGeometry args={[disc, 72]} />
        <meshStandardMaterial color="#12110f" metalness={0.28} roughness={0.72} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <ringGeometry args={[disc - 0.18, disc - 0.04, 80]} />
        <meshBasicMaterial color="#ff4b1f" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.018, 0]}>
        <ringGeometry args={[disc * 0.62, disc * 0.62 + 0.025, 80]} />
        <meshBasicMaterial color="#e8b15a" transparent opacity={0.7} />
      </mesh>
      <ContactShadows position={[0, 0.004, 0]} opacity={0.55} scale={disc * 2.4} blur={2.4} far={4} color="#050403" />
      <CameraControls
        ref={controls}
        smoothTime={calm ? 0 : 0.55}
        minDistance={2.2}
        maxDistance={wide ? 16 : 8}
        maxPolarAngle={Math.PI / 1.8}
        dollyToCursor={false}
      />
    </>
  );
}

export default function AvatarStage({
  roster,
  focusId = null,
  onFocus,
}: {
  roster: Agent[];
  focusId?: string | null;
  onFocus?: (id: string | null) => void;
}) {
  const calm = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    [],
  );
  for (const agent of roster) useGLTF.preload(agent.glb);
  const wide = roster.length > 3;
  return (
    <Canvas
      camera={{ position: [0, wide ? 1.9 : 1.2, wide ? 9.8 : 4.8], fov: wide ? 36 : 34 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, preserveDrawingBuffer: true }}
    >
      <Stage roster={roster} focusId={focusId} onFocus={onFocus} calm={calm} />
    </Canvas>
  );
}
