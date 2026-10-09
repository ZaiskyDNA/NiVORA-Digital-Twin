/** State UI (bukan simulasi): preset kamera, node terpilih, drawer bobot, hasil what-if. */
import { create } from 'zustand';
import type { WhatIfResult } from '../ui/viewModels';

export type CameraPreset = 'overview' | 'nodeA' | 'route' | 'focus';
/** Preset yang tampil sebagai tombol; 'focus' dipicu dengan memilih node. */
export type ButtonPreset = Exclude<CameraPreset, 'focus'>;
export const CAMERA_PRESETS: readonly ButtonPreset[] = ['overview', 'nodeA', 'route'];

interface ViewStore {
  preset: CameraPreset;
  /** Bertambah setiap preset dipilih — memicu animasi walau preset sama dipilih ulang. */
  presetNonce: number;
  /** Node yang dibuka kartu detailnya & difokuskan kamera. */
  selected: string | null;
  weightsOpen: boolean;
  whatIf: WhatIfResult | null;

  setPreset: (preset: ButtonPreset) => void;
  /** Pilih node → kamera fokus + kartu detail. `null` menutup detail & kembali ke overview. */
  selectNode: (id: string | null) => void;
  setWeightsOpen: (open: boolean) => void;
  setWhatIf: (result: WhatIfResult | null) => void;
}

export const useView = create<ViewStore>()((set, get) => ({
  preset: 'overview',
  presetNonce: 0,
  selected: null,
  weightsOpen: false,
  whatIf: null,

  setPreset: (preset) => set((s) => ({ preset, presetNonce: s.presetNonce + 1, selected: null })),
  selectNode: (id) => {
    if (id === null) {
      if (get().selected !== null) set((s) => ({ selected: null, preset: 'overview', presetNonce: s.presetNonce + 1 }));
      return;
    }
    set((s) => ({ selected: id, preset: 'focus', presetNonce: s.presetNonce + 1 }));
  },
  setWeightsOpen: (weightsOpen) => set({ weightsOpen }),
  setWhatIf: (whatIf) => set({ whatIf }),
}));
