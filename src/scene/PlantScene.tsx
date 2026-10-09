/**
 * Canvas, kamera isometrik, cahaya, lantai, dan seluruh objek pabrik (§6–7).
 * Fase 3: layout statis dari src/config/plant.ts; status node dibaca sekali dari store.
 */
import { ContactShadows } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { useMemo, useState } from 'react';
import { CONVEYORS, FACILITIES, WORKER_ZONES } from '../config/plant';
import { useSim } from '../store/useSim';
import { CameraRig } from './CameraRig';
import { Conveyor } from './Conveyor';
import { Facility } from './Facility';
import { Floor } from './Floor';
import { LabelLayer } from './LabelLayer';
import { LabelLeaders } from './LabelLeaders';
import { CAMERA_PRESETS_POSE, cameraPosition } from './layout';
import { NodeMarker } from './NodeMarker';
import { Roads } from './Roads';
import { buildSceneLabels } from './sceneLabels';
import { WorkerZone } from './WorkerZone';

export default function PlantScene() {
  // Snapshot awal; scene dinamis (warna live, pekerja, debu, truk) dikerjakan di Fase 4.
  const [nodes] = useState(() => useSim.getState().nivora.nodes);
  const labels = useMemo(() => buildSceneLabels(nodes), [nodes]);

  return (
    <div className="relative h-full w-full">
      <Canvas
        orthographic
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ near: 1, far: 500, zoom: 10, position: cameraPosition(CAMERA_PRESETS_POSE.overview) }}
        shadows="percentage"
        aria-label="Scene 3D pabrik nikel"
      >
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
        {FACILITIES.map((f) => (
          <Facility key={f.id} data={f} />
        ))}
        {CONVEYORS.map((c) => (
          <Conveyor key={c.id} data={c} />
        ))}
        {nodes.map((n) => (
          <NodeMarker key={n.id} node={n} />
        ))}
        <LabelLeaders labels={labels} />

        <ContactShadows position-y={0.02} scale={[84, 60]} opacity={0.35} blur={2.4} far={14} frames={1} />
        <CameraRig />
      </Canvas>
      <LabelLayer labels={labels} />
    </div>
  );
}
