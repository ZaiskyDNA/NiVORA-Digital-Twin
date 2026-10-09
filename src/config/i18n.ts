/**
 * Glosarium UI (§13.7): label Indonesia, istilah teknis Inggris.
 * Semua string yang tampil di UI diambil dari sini agar konsisten.
 */
import type { EdgeAIReason } from '../sim/edgeAI';
import type { PathwayStage } from '../sim/pathway';
import type { MweriClass, Status } from '../sim/types';

export const STATUS_LABEL: Record<Status, string> = {
  normal: 'Normal',
  warning: 'Warning',
  critical: 'Critical',
};

export const MWERI_CLASS_LABEL: Record<MweriClass, string> = {
  rendah: 'Rendah',
  sedang: 'Sedang',
  tinggi: 'Tinggi',
  kritis: 'Kritis',
};

export const EDGE_AI_REASON_LABEL: Record<EdgeAIReason, string> = {
  volume: 'volume',
  pm: 'partikulat',
  mweri: 'MWERI',
  trend: 'tren naik',
};

export const PATHWAY_LABEL: Record<PathwayStage, string> = {
  reuse: 'Reuse / Reprocessing',
  recycle: 'Repurpose / Recycle',
  recovery: 'Recovery',
  treatment: 'Treatment',
  disposal: 'Safe Disposal',
};

/** Alasan keputusan pathway saat tahap tersebut terpilih. */
export const PATHWAY_REASON: Record<PathwayStage, string> = {
  reuse: 'Karakteristik material masih memenuhi kebutuhan proses.',
  recycle: 'Tidak cocok untuk proses utama, tetapi bisa dimanfaatkan sebagai bahan sekunder.',
  recovery: 'Masih mengandung komponen bernilai yang dapat dipulihkan.',
  treatment: 'Perlu pengelolaan khusus sebelum aman ditangani lebih lanjut.',
  disposal: 'Tidak ada jalur sirkular yang layak — pilihan terakhir, ditimbun secara aman.',
};

export const FACILITY_LABEL: Record<string, string> = {
  stockpile: 'Stockpile',
  crusher: 'Crusher',
  smelter: 'Smelter / Proses Utama',
  reprocessing: 'Unit Reprocessing',
  recovery: 'Unit Recovery',
  treatment: 'Treatment',
  disposal: 'Safe Disposal',
};

/** Keterangan singkat di bawah label fasilitas pada scene. */
export const FACILITY_CAPTION: Record<string, string> = {
  stockpile: 'bijih nikel',
  crusher: 'sumber partikulat',
  smelter: 'SCADA/DCS link',
  reprocessing: 'tujuan residu layak proses',
  recovery: 'pemulihan komponen bernilai',
  treatment: 'pengelolaan khusus',
  disposal: 'pilihan terakhir',
};

export const ZONE_LABEL = {
  high: 'Zona aktivitas pekerja tinggi',
  workersDetected: (n: number) => `${n} pekerja terdeteksi (berbasis zona)`,
} as const;

export const CAMERA_PRESET_LABEL = {
  overview: 'Overview',
  nodeA: 'Fokus Node A',
  route: 'Rute',
} as const;

export const DISCLAIMER = {
  mweri:
    'MWERI adalah indeks prioritas, bukan instrumen diagnosis medis. Bobot perlu dikalibrasi data lapangan & ahli K3.',
  illustrative: 'Visualisasi konsep · seluruh nilai bersifat ilustratif',
} as const;
