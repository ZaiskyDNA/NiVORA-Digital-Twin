/**
 * Bloom ringan (§7, §13.8): hanya piksel HDR (> 1) — beacon, safe route, lampu truk — yang menyala.
 * EffectComposer mematikan tone mapping renderer, jadi ACES diterapkan ulang di akhir chain agar
 * warna material sama dengan tanpa efek.
 */
import { Bloom, EffectComposer, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';

export function Effects() {
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.85} radius={0.65} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
