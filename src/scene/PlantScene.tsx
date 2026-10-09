/**
 * Canvas, kamera isometrik, cahaya, lantai, dan seluruh objek pabrik (§6–7).
 * Fase 4: terhubung ke store lewat `simFrame` (animasi via ref) + selector string untuk
 * perubahan struktural (label, rute, barikade).
 */
import { ContactShadows } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { NODE_SEEDS, WORKER_ZONES } from '../config/plant';
import { Barricades } from './Barricade';
import { CameraRig } from './CameraRig';
import { ConveyorFlow } from './ConveyorFlow';
import { DustCloud } from './DustCloud';
import { Effects } from './Effects';
import { FacilityHitAreas } from './FacilityHitAreas';
import { Floor } from './Floor';
import { HaulTrucks } from './HaulTruck';
import { LabelLayer } from './LabelLayer';
import { LabelLeaders } from './LabelLeaders';
import { beaconHeight, CAMERA_PRESETS_POSE, cameraPosition } from './layout';
import { NodeCardLayer } from './NodeCardLayer';
import { NodeMarker } from './NodeMarker';
import { PerfProbe } from './PerfProbe';
import { Roads } from './Roads';
import { Routes } from './Routes';
import { SimSync } from './SimSync';
import { StaticPlant } from './StaticPlant';
import { WorkerZone } from './WorkerZone';
import { Workers } from './Workers';

/** Konstanta modul — props baru di tiap render membuat ContactShadows merender ulang scene. */
const SHADOW_SCALE: [number, number] = [84, 60];

/**
 * PlantScene sendiri tidak berlangganan store sama sekali: animasi lewat simFrame (ref), perubahan
 * struktural ditangani komponen anak kecil (Routes, Barricades, label) agar Canvas tidak re-render.
 */
export default function PlantScene() {
  return (
    <div className="relative h-full w-full">
      <Canvas
        orthographic
        dpr={[1, 1.5]}
        gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
        camera={{ near: 1, far: 500, zoom: 10, position: cameraPosition(CAMERA_PRESETS_POSE.overview) }}
        shadows="percentage"
        aria-label="Scene 3D pabrik nikel"
      >
        <SimSync />
        <hemisphereLight args={['#9fc4ff', '#0b1424', 0.55]} />
        <ambientLight intensity={0.25} />
        <directionalLight
          position={[30, 45, 18]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-50}
          shadow-camera-right={50}
          shadow-camera-top={40}
          shadow-camera-bottom={-40}
          shadow-bias={-0.0005}
        />

        <Floor />
        <Roads />
        {WORKER_ZONES.map((zone) => (
          <WorkerZone key={zone.id} {...zone} emphasis={zone.id === 'wz-high'} />
        ))}
        <StaticPlant />
        <FacilityHitAreas />
        <ConveyorFlow />
        <Routes />
        <Barricades />
        {NODE_SEEDS.map((n, i) => (
          <NodeMarker key={n.id} nodeId={n.id} index={i} position={n.position} />
        ))}
        {NODE_SEEDS.map((n, i) => (
          <DustCloud key={n.id} index={i} position={n.position} height={beaconHeight(n.id)} seed={101 + i} />
        ))}
        <Workers />
        <HaulTrucks />
        <LabelLeaders />

        <ContactShadows position-y={0.02} scale={SHADOW_SCALE} opacity={0.35} blur={2.4} far={14} frames={1} />
        <CameraRig />
        <Effects />
        {import.meta.env.DEV && <PerfProbe />}
      </Canvas>
      <LabelLayer />
      <NodeCardLayer />
    </div>
  );
}
