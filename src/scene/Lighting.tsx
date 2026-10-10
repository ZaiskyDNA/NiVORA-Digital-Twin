/**
 * Cahaya & bayangan kontak per tema. Komponen terpisah agar PlantScene tetap tidak berlangganan
 * store apa pun (§13.12). ContactShadows dirender sekali (frames={1}) → `key` tema memaksanya
 * menggambar ulang saat tema berganti.
 */
import { ContactShadows } from '@react-three/drei';
import { useScenePalette } from './useScenePalette';

/** Konstanta modul — props baru di tiap render membuat ContactShadows merender ulang scene. */
const SHADOW_SCALE: [number, number] = [84, 60];

export function Lighting() {
  const { light, shadow, theme } = useScenePalette();
  return (
    <>
      <hemisphereLight args={[light.hemiSky, light.hemiGround, light.hemi]} />
      <ambientLight intensity={light.ambient} />
      <directionalLight
        color={light.sun}
        position={[30, 45, 18]}
        intensity={light.sunIntensity}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-bias={-0.0005}
      />
      <ContactShadows
        key={theme}
        position-y={0.02}
        scale={SHADOW_SCALE}
        color={shadow.color}
        opacity={shadow.opacity}
        blur={shadow.blur}
        far={14}
        frames={1}
      />
    </>
  );
}
