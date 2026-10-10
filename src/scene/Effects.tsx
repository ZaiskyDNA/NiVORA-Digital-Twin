/**
 * Bloom ringan (§7, §13.8) — HANYA di tema gelap: piksel HDR (> 1) dari beacon, safe route, dan
 * lampu truk menyala. Tema terang tidak memakai Bloom (cahaya di latar terang hanya memutihkan);
 * penekanan diganti warna pekat + outline. EffectComposer mematikan tone mapping renderer, jadi
 * tone mapping diterapkan ulang di akhir chain: ACES untuk gelap, Neutral untuk terang agar
 * abu-abu terang lantai & bangunan tidak ikut menjadi kusam.
 */
import { Bloom, EffectComposer, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { useScenePalette } from './useScenePalette';

export function Effects() {
  const { bloom, theme } = useScenePalette();
  // key: susunan pass berbeda per tema → composer dibangun ulang, bukan ditambal.
  return (
    <EffectComposer key={theme} multisampling={4} enableNormalPass={false}>
      {bloom.enabled ? (
        <Bloom mipmapBlur luminanceThreshold={1} luminanceSmoothing={0.2} intensity={0.85} radius={0.65} />
      ) : (
        <></>
      )}
      <ToneMapping mode={bloom.enabled ? ToneMappingMode.ACES_FILMIC : ToneMappingMode.NEUTRAL} />
    </EffectComposer>
  );
}
