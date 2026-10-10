/** Palet scene tema aktif. Berganti hanya saat tema diganti (jarang) — aman untuk re-render. */
import { useTheme } from '../store/useTheme';
import { SCENE_PALETTE, type ScenePalette } from './palette';

export const useScenePalette = (): ScenePalette => SCENE_PALETTE[useTheme((s) => s.theme)];
