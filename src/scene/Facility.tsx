/** Bangunan generik low-poly: box dengan muka atas lebih terang + tepi menyala tipis (§7). */
import { Edges, Line } from '@react-three/drei';
import type { ReactNode } from 'react';
import type { Facility as FacilityData } from '../config/plant';
import type { Vec3 } from '../sim/types';
import { FACILITY_STYLE, type FacilityStyle } from './palette';

/** Box dengan material per muka (urutan BoxGeometry: +x, −x, +y, −y, +z, −z). */
export function GlowBox({
  size,
  position,
  style,
  edgeOpacity = 0.45,
}: {
  size: Vec3;
  position: Vec3;
  style: FacilityStyle;
  edgeOpacity?: number;
}) {
  const [w, h, d] = size;
  const hw = w / 2;
  const hd = d / 2;
  const top = h / 2 + 0.01;
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <meshStandardMaterial
            key={i}
            attach={`material-${i}`}
            color={i === 2 ? style.top : style.body}
            roughness={0.75}
            metalness={0.05}
            flatShading
          />
        ))}
        <Edges color={style.edge} lineWidth={1} transparent opacity={edgeOpacity} toneMapped={false} />
      </mesh>
      {/* Tepi atas lebih terang — ciri gaya digital twin pada referensi. */}
      <Line
        points={[
          [-hw, top, -hd],
          [hw, top, -hd],
          [hw, top, hd],
          [-hw, top, hd],
          [-hw, top, -hd],
        ]}
        color={style.edge}
        lineWidth={1.6}
        toneMapped={false}
      />
    </group>
  );
}

function Stockpile({ size, style }: { size: Vec3; style: FacilityStyle }) {
  const [w, h, d] = size;
  const tiers = 4;
  return (
    <>
      {Array.from({ length: tiers }, (_, i) => {
        const k = 1 - i * 0.22;
        const th = h / tiers;
        return <GlowBox key={i} size={[w * k, th, d * k]} position={[0, th * (i + 0.5), 0]} style={style} />;
      })}
    </>
  );
}

function Disposal({ size, style }: { size: Vec3; style: FacilityStyle }) {
  const [w, , d] = size;
  const rim = 0.6;
  return (
    <>
      {/* Lubang: dasar gelap dikelilingi bibir rendah. */}
      <mesh position={[0, 0.03, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[w - rim, d - rim]} />
        <meshStandardMaterial color="#1f1611" roughness={1} />
      </mesh>
      <GlowBox size={[w, 0.5, rim]} position={[0, 0.25, -d / 2 + rim / 2]} style={style} />
      <GlowBox size={[w, 0.5, rim]} position={[0, 0.25, d / 2 - rim / 2]} style={style} />
      <GlowBox size={[rim, 0.5, d - 2 * rim]} position={[-w / 2 + rim / 2, 0.25, 0]} style={style} />
      <GlowBox size={[rim, 0.5, d - 2 * rim]} position={[w / 2 - rim / 2, 0.25, 0]} style={style} />
      {/* Tumpukan residu tertimbun. */}
      <GlowBox size={[w * 0.45, 0.6, d * 0.18]} position={[-w * 0.12, 0.3, d * 0.08]} style={style} edgeOpacity={0.3} />
    </>
  );
}

function Smelter({ size, style }: { size: Vec3; style: FacilityStyle }) {
  const [w, h, d] = size;
  const stack = { body: '#1d2840', top: '#2a3858', edge: style.edge };
  return (
    <>
      <GlowBox size={size} position={[0, h / 2, 0]} style={style} />
      {/* Dua cerobong (§6). */}
      <GlowBox size={[1.6, h * 0.75, 1.6]} position={[-w * 0.3, h + (h * 0.75) / 2, -d * 0.15]} style={stack} />
      <GlowBox size={[1.6, h * 0.55, 1.6]} position={[-w * 0.08, h + (h * 0.55) / 2, d * 0.05]} style={stack} />
    </>
  );
}

function Crusher({ size, style }: { size: Vec3; style: FacilityStyle }) {
  const [w, h, d] = size;
  return (
    <>
      <GlowBox size={[w, h * 0.7, d]} position={[0, (h * 0.7) / 2, 0]} style={style} />
      <GlowBox size={[w * 0.6, h * 0.3, d * 0.6]} position={[0, h * 0.7 + (h * 0.3) / 2, 0]} style={style} />
    </>
  );
}

export function Facility({ data }: { data: FacilityData }) {
  const style = FACILITY_STYLE[data.kind];
  const [x, , z] = data.position;
  let body: ReactNode;
  switch (data.kind) {
    case 'stockpile':
      body = <Stockpile size={data.size} style={style} />;
      break;
    case 'disposal':
      body = <Disposal size={data.size} style={style} />;
      break;
    case 'smelter':
      body = <Smelter size={data.size} style={style} />;
      break;
    case 'crusher':
      body = <Crusher size={data.size} style={style} />;
      break;
    default:
      body = <GlowBox size={data.size} position={[0, data.size[1] / 2, 0]} style={style} />;
  }
  return <group position={[x, 0, z]}>{body}</group>;
}
