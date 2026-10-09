/** State UI scene (bukan simulasi): preset kamera aktif. */
import { create } from 'zustand';

export type CameraPreset = 'overview' | 'nodeA' | 'route';
export const CAMERA_PRESETS: readonly CameraPreset[] = ['overview', 'nodeA', 'route'];

interface ViewStore {
  preset: CameraPreset;
  /** Bertambah setiap preset dipilih — memicu animasi walau preset sama dipilih ulang. */
  presetNonce: number;
  setPreset: (preset: CameraPreset) => void;
}

export const useView = create<ViewStore>()((set) => ({
  preset: 'overview',
  presetNonce: 0,
  setPreset: (preset) => set((s) => ({ preset, presetNonce: s.presetNonce + 1 })),
}));
